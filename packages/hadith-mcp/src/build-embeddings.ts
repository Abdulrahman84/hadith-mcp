#!/usr/bin/env node
import path from "node:path";
import { parseArgs } from "node:util";

import { createEmbeddingProviderFromEnv } from "./embeddings/provider.js";
import { buildEmbeddingIndex } from "./embeddings/store.js";

const defaultDb = "../../data/generated/hadith-meeatif.sqlite";
const defaultOut = "../../data/generated/hadith-embeddings.sqlite";

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      db: { type: "string" },
      out: { type: "string" },
      "batch-size": { type: "string" },
      limit: { type: "string" }
    }
  });

  const sourceDbPath = path.resolve(values.db ?? process.env.HADITH_MCP_DB_PATH ?? defaultDb);
  const outPath = path.resolve(values.out ?? process.env.HADITH_MCP_EMBEDDINGS_PATH ?? defaultOut);
  const batchSize = values["batch-size"] ? Number.parseInt(values["batch-size"], 10) : 32;
  const limit = values.limit ? Number.parseInt(values.limit, 10) : undefined;
  const provider = createEmbeddingProviderFromEnv();

  if (provider === null) {
    throw new Error("No embedding provider configured. Set EMBEDDINGS_PROVIDER=ollama (default) or EMBEDDINGS_BASE_URL.");
  }

  console.error(`Embedding ${sourceDbPath}`);
  console.error(`  into ${outPath}`);
  console.error(`  with ${provider.model} via ${provider.name}, batch size ${batchSize}${limit === undefined ? "" : `, limit ${limit}`}`);

  const startedAt = Date.now();
  let lastLog = 0;
  const result = await buildEmbeddingIndex({
    sourceDbPath,
    outPath,
    provider,
    batchSize,
    ...(limit === undefined ? {} : { limit }),
    onProgress: ({ embedded, skipped, total }) => {
      const now = Date.now();
      const remaining = total - skipped - embedded;

      if (now - lastLog < 5000 && remaining > 0) {
        return;
      }

      lastLog = now;
      const seconds = (now - startedAt) / 1000;
      const rate = seconds > 0 ? embedded / seconds : 0;
      const eta = rate > 0 ? Math.round(remaining / rate) : null;
      console.error(
        `  ${embedded} embedded, ${skipped} already current, ${remaining} left` +
          (rate > 0 ? ` (${rate.toFixed(1)}/s${eta === null ? "" : `, ~${eta}s left`})` : "")
      );
    }
  });

  console.error(
    `Done in ${((Date.now() - startedAt) / 1000).toFixed(1)}s: ${result.embedded} embedded, ${result.skipped} skipped, ` +
      `${result.removed} removed, ${result.dims ?? "?"} dimensions, model ${result.model}.`
  );
}

main().catch((error: unknown) => {
  console.error("Embedding build failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
