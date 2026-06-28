import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createHadithMcpServer, createSqliteHadithService } from "../src/index.js";
import {
  fetchHadithOutputSchema,
  gradeOutputSchema,
  listCollectionsOutputSchema,
  searchHadithOutputSchema,
  validateReferenceOutputSchema
} from "../src/schemas.js";

const rootDir = path.resolve(process.cwd(), "../..");
let tempDir = "";
let dbPath = "";

beforeAll(() => {
  tempDir = mkdtempSync(path.join(os.tmpdir(), "hadith-mcp-sqlite-test-"));
  dbPath = path.join(tempDir, "fixture.sqlite");
  execFileSync("npm", ["run", "build:fixture-sqlite", "-w", "@hadith-mcp/data", "--", "--out", dbPath], {
    cwd: rootDir,
    stdio: "pipe"
  });
});

afterAll(() => {
  if (tempDir.length > 0) {
    rmSync(tempDir, { force: true, recursive: true });
  }
});

describe("sqlite-backed hadith service", () => {
  it("lists collections from SQLite", () => {
    const service = createSqliteHadithService(dbPath);
    const output = service.listCollections();

    expect(() => listCollectionsOutputSchema.parse(output)).not.toThrow();
    expect(output.collections.map((collection) => collection.collection)).toEqual(["bukhari", "muslim", "tirmidhi"]);
    expect(output.collections[0]?.source_dataset).toBe("fixture-only/non-release");
  });

  it("fetches a record by alias with source provenance", () => {
    const service = createSqliteHadithService(dbPath);
    const output = service.fetchHadith({
      collection: "sahih-bukhari",
      hadith_number: 1,
      language: "both"
    });

    expect(() => fetchHadithOutputSchema.parse(output)).not.toThrow();

    if ("error" in output.result) {
      throw new Error("expected SQLite record");
    }

    expect(output.result.collection).toBe("bukhari");
    expect(output.result.source_dataset).toBe("fixture-only/non-release");
    expect(output.result.provenance_notes.join(" ")).toContain("Source dataset");
  });

  it("resolves collection-prefixed and source-url references", () => {
    const service = createSqliteHadithService(dbPath);
    const prefixed = service.fetchHadith({
      collection: "ignored-when-reference-has-known-prefix",
      hadith_number: "bukhari:1"
    });
    const sourceUrl = service.fetchHadith({
      collection: "muslim",
      hadith_number: "https://example.test/source/muslim:1a"
    });

    expect(() => fetchHadithOutputSchema.parse(prefixed)).not.toThrow();
    expect(() => fetchHadithOutputSchema.parse(sourceUrl)).not.toThrow();

    if ("error" in prefixed.result || "error" in sourceUrl.result) {
      throw new Error("expected resolved SQLite records");
    }

    expect(prefixed.result.collection).toBe("bukhari");
    expect(prefixed.result.hadith_number).toBe("1");
    expect(sourceUrl.result.collection).toBe("muslim");
    expect(sourceUrl.result.hadith_number).toBe("1");
  });

  it("searches SQLite FTS and returns snippets only", () => {
    const service = createSqliteHadithService(dbPath);
    const output = service.searchHadith({
      query: "fixture",
      language: "english",
      limit: 2,
      offset: 0
    });

    expect(() => searchHadithOutputSchema.parse(output)).not.toThrow();
    expect(output.total).toBeGreaterThan(0);
    expect(output.results).toHaveLength(2);
    expect(output.results[0]?.snippet).toContain("fixture");
  });

  it("validates references and returns suggestions from SQLite", () => {
    const service = createSqliteHadithService(dbPath);
    const valid = service.validateHadithReference({ collection: "unknown", hadith_number: "tirmidhi:1" });
    const invalid = service.validateHadithReference({ collection: "bukhari", hadith_number: "99" });

    expect(() => validateReferenceOutputSchema.parse(valid)).not.toThrow();
    expect(() => validateReferenceOutputSchema.parse(invalid)).not.toThrow();
    expect(valid.valid).toBe(true);
    expect(valid.canonical_collection).toBe("tirmidhi");
    expect(valid.hadith_number).toBe("1");
    expect(invalid.valid).toBe(false);
    expect(invalid.suggestions.length).toBeGreaterThan(0);
  });

  it("returns source-attributed grades and grade nulls from SQLite", () => {
    const service = createSqliteHadithService(dbPath);
    const graded = service.getHadithGrade({ collection: "tirmidhi", hadith_number: "1" });
    const ungraded = service.getHadithGrade({ collection: "bukhari", hadith_number: "1" });

    expect(() => gradeOutputSchema.parse(graded)).not.toThrow();
    expect(() => gradeOutputSchema.parse(ungraded)).not.toThrow();

    if ("error" in graded.result || "error" in ungraded.result) {
      throw new Error("expected SQLite grade results");
    }

    expect(graded.result.grade?.source).toBe("fixture grader");
    expect(ungraded.result.grade).toBeNull();
    expect(ungraded.result.provenance_notes.join(" ")).toContain("No source-attributed grade");
  });

  it("registers SQLite-backed MCP tools", async () => {
    const server = createHadithMcpServer({ dbPath });
    const client = new Client({
      name: "hadith-mcp-sqlite-test-client",
      version: "0.0.0"
    });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    try {
      const result = await client.callTool({
        name: "fetch_hadith",
        arguments: {
          collection: "bukhari",
          hadith_number: "1"
        }
      });

      expect(result.structuredContent).toMatchObject({
        result: {
          collection: "bukhari",
          hadith_number: "1",
          source_dataset: "fixture-only/non-release"
        }
      });
    } finally {
      await client.close();
      await server.close();
    }
  });
});
