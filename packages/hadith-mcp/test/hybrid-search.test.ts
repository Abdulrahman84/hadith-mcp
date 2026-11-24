import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import {
  buildEmbeddingIndex,
  createEmbeddingProviderFromEnv,
  createFakeEmbeddingProvider,
  createHadithMcpServer,
  createHybridSearcher,
  createOpenAiCompatibleEmbeddingProvider,
  createOllamaEmbeddingProvider,
  createSqliteHadithService,
  loadEmbeddingIndex,
  reciprocalRankFusion,
  type EmbeddingProvider
} from "../src/index.js";
import { semanticSearchHadithOutputSchema } from "../src/schemas.js";

const rootDir = path.resolve(process.cwd(), "../..");
let tempDir = "";
let dbPath = "";
let indexPath = "";
const provider = createFakeEmbeddingProvider({ dims: 64 });

beforeAll(async () => {
  tempDir = mkdtempSync(path.join(os.tmpdir(), "hadith-mcp-hybrid-test-"));
  dbPath = path.join(tempDir, "fixture.sqlite");
  indexPath = path.join(tempDir, "embeddings.sqlite");
  execFileSync("npm", ["run", "build:fixture-sqlite", "-w", "@hadith-mcp/data", "--", "--out", dbPath], {
    cwd: rootDir,
    stdio: "pipe"
  });
  await buildEmbeddingIndex({ sourceDbPath: dbPath, outPath: indexPath, provider, batchSize: 2 });
});

afterAll(() => {
  if (tempDir.length > 0) {
    rmSync(tempDir, { force: true, recursive: true });
  }
});

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
}

describe("reciprocal rank fusion", () => {
  it("rewards items found by both lists and records per-list ranks", () => {
    const fused = reciprocalRankFusion([
      { name: "fts", keys: ["a", "b", "c"] },
      { name: "vector", keys: ["c", "d", "a"] }
    ]);

    expect(fused.map((item) => item.key)).toEqual(["a", "c", "b", "d"]);
    expect(fused[0]?.ranks).toEqual({ fts: 1, vector: 3 });
    expect(fused[0]?.score).toBeCloseTo(1 / 61 + 1 / 63);
    expect(fused[3]?.ranks).toEqual({ fts: null, vector: 2 });
  });

  it("applies list weights and skips zero-weight lists", () => {
    const fused = reciprocalRankFusion([
      { name: "fts", weight: 0.2, keys: ["a", "b"] },
      { name: "vector", weight: 0.8, keys: ["b", "c"] }
    ]);

    expect(fused.map((item) => item.key)).toEqual(["b", "c", "a"]);
    expect(fused[0]?.score).toBeCloseTo(0.2 / 62 + 0.8 / 61);

    const vectorOnly = reciprocalRankFusion([
      { name: "fts", weight: 0, keys: ["a"] },
      { name: "vector", weight: 1, keys: ["c"] }
    ]);
    expect(vectorOnly.map((item) => item.key)).toEqual(["c"]);
    expect(vectorOnly[0]?.ranks).toEqual({ fts: null, vector: 1 });
  });

  it("breaks ties in favor of the first list", () => {
    const fused = reciprocalRankFusion([
      { name: "fts", keys: ["x"] },
      { name: "vector", keys: ["y"] }
    ]);

    expect(fused.map((item) => item.key)).toEqual(["x", "y"]);
  });
});

describe("embedding index build", () => {
  it("stores one normalized vector per hadith", async () => {
    const index = await loadEmbeddingIndex(indexPath, provider.model);

    expect(index.size).toBe(3);
    expect(index.dims).toBe(64);
    expect(index.collections.sort()).toEqual(["bukhari", "muslim", "tirmidhi"]);

    const first = index.matrix.subarray(0, 64);
    const norm = Math.sqrt(first.reduce((sum, value) => sum + value * value, 0));
    expect(norm).toBeCloseTo(1, 5);
  });

  it("resumes without re-embedding unchanged rows", async () => {
    let calls = 0;
    const counting: EmbeddingProvider = {
      ...provider,
      async embed(texts) {
        calls += texts.length;
        return provider.embed(texts);
      }
    };

    const result = await buildEmbeddingIndex({ sourceDbPath: dbPath, outPath: indexPath, provider: counting });

    expect(result).toMatchObject({ total: 3, embedded: 0, skipped: 3, removed: 0 });
    expect(calls).toBe(0);
  });

  it("reports missing vectors in check mode without embedding", async () => {
    const result = await buildEmbeddingIndex({
      sourceDbPath: dbPath,
      outPath: indexPath,
      provider,
      model: "not-built-yet",
      checkOnly: true
    });

    expect(result).toMatchObject({ model: "not-built-yet", total: 3, skipped: 0, pending: 3, embedded: 0 });

    const current = await buildEmbeddingIndex({ sourceDbPath: dbPath, outPath: indexPath, provider, checkOnly: true });
    expect(current).toMatchObject({ total: 3, skipped: 3, pending: 0 });
  });

  it("refuses an index for a different model", async () => {
    await expect(loadEmbeddingIndex(indexPath, "other-model")).rejects.toThrow(/no vectors for model other-model/);
  });
});

describe("hybrid semantic search", () => {
  it("finds records by vector similarity when full-text search has no hits", async () => {
    const service = createSqliteHadithService(dbPath);
    const searcher = createHybridSearcher({ service, indexPath, provider });
    const output = await searcher.semanticSearchHadith({ query: "Muslim zzzunmatched", language: "english" });

    expect(() => semanticSearchHadithOutputSchema.parse(output)).not.toThrow();
    expect(output.mode).toBe("hybrid");
    expect(output.results[0]?.collection).toBe("muslim");
    expect(output.results[0]?.scores).toMatchObject({ fts_rank: null, vector_rank: 1 });
    expect(output.results[0]?.english_text).toContain("fixture Muslim text");
    expect(output.results.map((result) => result.rank)).toEqual(output.results.map((_, index) => index + 1));
  });

  it("loads the index under indexModel when the query API names the model differently", async () => {
    const service = createSqliteHadithService(dbPath);
    const renamed: EmbeddingProvider = { ...provider, model: "vendor/" + provider.model };
    const searcher = createHybridSearcher({ service, indexPath, provider: renamed, indexModel: provider.model });
    const output = await searcher.semanticSearchHadith({ query: "Muslim zzzunmatched", language: "english" });

    expect(output.mode).toBe("hybrid");
    expect(output.results[0]?.collection).toBe("muslim");

    const unmapped = createHybridSearcher({ service, indexPath, provider: renamed });
    const fallback = await unmapped.semanticSearchHadith({ query: "Muslim zzzunmatched", language: "english" });
    expect(fallback.mode).toBe("fts_fallback");
  });

  it("fuses full-text and vector ranks for the same record", async () => {
    const service = createSqliteHadithService(dbPath);
    const searcher = createHybridSearcher({ service, indexPath, provider });
    const output = await searcher.semanticSearchHadith({ query: "Tirmidhi", language: "english", limit: 2 });

    expect(output.results).toHaveLength(2);
    expect(output.results[0]?.collection).toBe("tirmidhi");
    expect(output.results[0]?.scores.fts_rank).toBe(1);
    expect(output.results[0]?.scores.vector_rank).not.toBeNull();
    expect(output.results[0]?.scores.rrf).toBeGreaterThan(0.5 / 61);
    expect(output.provenance_notes.join(" ")).toContain("reciprocal rank fusion");
  });

  it("applies the collection filter to vector hits", async () => {
    const service = createSqliteHadithService(dbPath);
    const searcher = createHybridSearcher({ service, indexPath, provider });
    const output = await searcher.semanticSearchHadith({ query: "Muslim zzzunmatched", collection: "sahih-bukhari" });

    expect(output.collection).toBe("bukhari");
    expect(output.results.every((result) => result.collection === "bukhari")).toBe(true);
  });

  it("supports fts, vector and weighted hybrid modes", async () => {
    const service = createSqliteHadithService(dbPath);
    const searcher = createHybridSearcher({ service, indexPath, provider, defaultVectorWeight: 0.7 });
    const query = { query: "Muslim zzzunmatched", language: "english" as const };

    const fts = await searcher.semanticSearchHadith({ ...query, mode: "fts" });
    const vector = await searcher.semanticSearchHadith({ ...query, mode: "vector" });
    const hybridDefault = await searcher.semanticSearchHadith(query);
    const hybridFtsHeavy = await searcher.semanticSearchHadith({ ...query, vector_weight: 0 });

    expect(fts).toMatchObject({ mode: "fts", vector_weight: null, total: 0, results: [] });
    expect(fts.provenance_notes.join(" ")).not.toContain("unavailable");
    expect(vector.mode).toBe("vector");
    expect(vector.vector_weight).toBe(1);
    expect(vector.results[0]?.collection).toBe("muslim");
    expect(vector.results.every((result) => result.scores.fts_rank === null)).toBe(true);
    expect(hybridDefault.vector_weight).toBe(0.7);
    expect(hybridDefault.provenance_notes.join(" ")).toContain("vector weight 0.7");
    expect(hybridFtsHeavy.vector_weight).toBe(0);
    expect(hybridFtsHeavy.results).toEqual([]);
    expect(() => semanticSearchHadithOutputSchema.parse(vector)).not.toThrow();
    expect(() => semanticSearchHadithOutputSchema.parse(fts)).not.toThrow();
  });

  it("falls back to full-text search without an index", async () => {
    const service = createSqliteHadithService(dbPath);
    const searcher = createHybridSearcher({ service, indexPath: null, provider });
    const output = await searcher.semanticSearchHadith({ query: "Tirmidhi", language: "english" });

    expect(output.mode).toBe("fts_fallback");
    expect(output.results[0]?.scores).toEqual({ rrf: null, fts_rank: 1, vector_rank: null, vector_similarity: null });
    expect(output.provenance_notes.join(" ")).toContain("HADITH_MCP_EMBEDDINGS_PATH");
  });

  it("falls back when the index file is missing or the provider fails", async () => {
    const service = createSqliteHadithService(dbPath);
    const missing = createHybridSearcher({ service, indexPath: path.join(tempDir, "nope.sqlite"), provider });
    const failing = createHybridSearcher({
      service,
      indexPath,
      provider: {
        name: "broken",
        model: provider.model,
        async embed() {
          throw new Error("connection refused");
        }
      }
    });

    const missingOutput = await missing.semanticSearchHadith({ query: "Tirmidhi", language: "english" });
    const failingOutput = await failing.semanticSearchHadith({ query: "Tirmidhi", language: "english" });

    expect(missingOutput.mode).toBe("fts_fallback");
    expect(missingOutput.provenance_notes.join(" ")).toContain("Embedding index not found");
    expect(failingOutput.mode).toBe("fts_fallback");
    expect(failingOutput.provenance_notes.join(" ")).toContain("connection refused");
    expect(failingOutput.results[0]?.collection).toBe("tirmidhi");
  });

  it("is exposed as an MCP tool", async () => {
    const service = createSqliteHadithService(dbPath);
    const server = createHadithMcpServer({
      service,
      hybridSearch: createHybridSearcher({ service, indexPath, provider })
    });
    const client = new Client({ name: "hadith-mcp-hybrid-test-client", version: "0.0.0" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    try {
      const tools = await client.listTools();
      expect(tools.tools.map((tool) => tool.name)).toContain("semantic_search_hadith");

      const result = await client.callTool({
        name: "semantic_search_hadith",
        arguments: { query: "Muslim zzzunmatched", language: "english", limit: 1, mode: "hybrid", vector_weight: 0.6 }
      });

      expect(result.structuredContent).toMatchObject({
        mode: "hybrid",
        vector_weight: 0.6,
        results: [{ collection: "muslim", rank: 1 }]
      });
    } finally {
      await client.close();
      await server.close();
    }
  });

  it("answers with full-text results on the default server", async () => {
    const server = createHadithMcpServer();
    const client = new Client({ name: "hadith-mcp-hybrid-default-client", version: "0.0.0" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    try {
      const result = await client.callTool({ name: "semantic_search_hadith", arguments: { query: "fixture" } });
      expect(result.isError).toBeFalsy();
      expect(result.structuredContent).toMatchObject({ mode: "fts_fallback" });
    } finally {
      await client.close();
      await server.close();
    }
  });
});

describe("embedding providers", () => {
  it("parses Ollama /api/embed responses", async () => {
    let requestedUrl = "";
    let requestedBody: unknown;
    const ollama = createOllamaEmbeddingProvider({
      baseUrl: "http://ollama.test/",
      fetchImpl: async (url, init) => {
        requestedUrl = url;
        requestedBody = JSON.parse(String(init?.body));
        return jsonResponse({ embeddings: [[3, 4], [0, 2]] });
      }
    });

    const vectors = await ollama.embed(["a", "b"]);

    expect(requestedUrl).toBe("http://ollama.test/api/embed");
    expect(requestedBody).toEqual({ model: "bge-m3", input: ["a", "b"] });
    expect(Array.from(vectors[0] ?? [])).toEqual([expect.closeTo(0.6), expect.closeTo(0.8)]);
    expect(Array.from(vectors[1] ?? [])).toEqual([0, 1]);
  });

  it("orders OpenAI-compatible embeddings by index and sends the key", async () => {
    let auth: string | null = null;
    const openai = createOpenAiCompatibleEmbeddingProvider({
      baseUrl: "https://embeddings.test/v1",
      apiKey: "test-key",
      model: "m",
      fetchImpl: async (_url, init) => {
        auth = new Headers(init?.headers).get("Authorization");
        return jsonResponse({
          data: [
            { index: 1, embedding: [0, 1] },
            { index: 0, embedding: [1, 0] }
          ]
        });
      }
    });

    const vectors = await openai.embed(["first", "second"]);

    expect(auth).toBe("Bearer test-key");
    expect(Array.from(vectors[0] ?? [])).toEqual([1, 0]);
    expect(Array.from(vectors[1] ?? [])).toEqual([0, 1]);
  });

  it("throws on HTTP errors", async () => {
    const ollama = createOllamaEmbeddingProvider({
      fetchImpl: async () => new Response("model not found", { status: 404 })
    });

    await expect(ollama.embed(["a"])).rejects.toThrow(/HTTP 404: model not found/);
  });

  it("sends dimensions and provider routing, and prefixes only search queries", async () => {
    const bodies: Array<{ input: string[]; dimensions?: number; provider?: unknown }> = [];
    const configured = createEmbeddingProviderFromEnv(
      {
        EMBEDDINGS_BASE_URL: "https://embeddings.test/v1",
        EMBEDDINGS_MODEL: "qwen/qwen3-embedding-8b",
        EMBEDDINGS_DIMENSIONS: "1024",
        EMBEDDINGS_PROVIDER_ORDER: "DeepInfra, Nebius",
        EMBEDDINGS_QUERY_PREFIX: "Instruct: find hadith\\nQuery: "
      },
      async (_url, init) => {
        const body = JSON.parse(String(init?.body)) as { input: string[]; dimensions?: number; provider?: unknown };
        bodies.push(body);
        return jsonResponse({ data: body.input.map((_, index) => ({ index, embedding: [1, 0] })) });
      }
    );

    expect(configured?.queryPrefix).toBe("Instruct: find hadith\nQuery: ");

    await configured!.embed(["document text"]);
    expect(bodies[0]).toMatchObject({
      input: ["document text"],
      dimensions: 1024,
      provider: { order: ["DeepInfra", "Nebius"], allow_fallbacks: true }
    });

    const service = createSqliteHadithService(dbPath);
    const searcher = createHybridSearcher({
      service,
      indexPath,
      indexModel: provider.model,
      provider: { ...configured!, embed: async (texts) => {
        bodies.push({ input: texts });
        return provider.embed(texts);
      } }
    });
    await searcher.semanticSearchHadith({ query: "Muslim", language: "english" });
    expect(bodies.at(-1)?.input[0]).toMatch(/^Instruct: find hadith\nQuery: /);

    const plain = createEmbeddingProviderFromEnv({ EMBEDDINGS_BASE_URL: "https://embeddings.test/v1" }, async (_url, init) => {
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      expect(body).not.toHaveProperty("dimensions");
      expect(body).not.toHaveProperty("provider");
      return jsonResponse({ data: [{ index: 0, embedding: [1, 0] }] });
    });
    expect(plain?.queryPrefix).toBeUndefined();
    await plain!.embed(["a"]);
  });

  it("retries overloaded and server errors, but not client errors", async () => {
    const statuses = [429, 503];
    let calls = 0;
    const flaky = createOpenAiCompatibleEmbeddingProvider({
      baseUrl: "https://embeddings.test/v1",
      model: "m",
      fetchImpl: async () => {
        const status = statuses[calls];
        calls += 1;
        return status === undefined
          ? jsonResponse({ data: [{ index: 0, embedding: [1, 0] }] })
          : new Response("engine overloaded", { status, headers: { "Retry-After": "0" } });
      }
    });

    expect(Array.from((await flaky.embed(["a"]))[0] ?? [])).toEqual([1, 0]);
    expect(calls).toBe(3);

    let alwaysCalls = 0;
    const overloaded = createOpenAiCompatibleEmbeddingProvider({
      baseUrl: "https://embeddings.test/v1",
      model: "m",
      fetchImpl: async () => {
        alwaysCalls += 1;
        return new Response("engine overloaded", { status: 429, headers: { "Retry-After": "0" } });
      }
    });

    await expect(overloaded.embed(["a"])).rejects.toThrow(/HTTP 429/);
    expect(alwaysCalls).toBe(3);

    let badRequestCalls = 0;
    const invalid = createOpenAiCompatibleEmbeddingProvider({
      baseUrl: "https://embeddings.test/v1",
      model: "m",
      fetchImpl: async () => {
        badRequestCalls += 1;
        return new Response("bad input", { status: 400 });
      }
    });

    await expect(invalid.embed(["a"])).rejects.toThrow(/HTTP 400/);
    expect(badRequestCalls).toBe(1);
  });

  it("selects the provider from the environment", () => {
    expect(createEmbeddingProviderFromEnv({})?.name).toBe("ollama");
    expect(createEmbeddingProviderFromEnv({ EMBEDDINGS_MODEL: "custom" })?.model).toBe("custom");
    expect(createEmbeddingProviderFromEnv({ EMBEDDINGS_BASE_URL: "https://x.test/v1" })?.name).toBe("openai-compatible");
    expect(createEmbeddingProviderFromEnv({ EMBEDDINGS_PROVIDER: "openai" })).toBeNull();
    expect(createEmbeddingProviderFromEnv({ EMBEDDINGS_PROVIDER: "none" })).toBeNull();
  });
});
