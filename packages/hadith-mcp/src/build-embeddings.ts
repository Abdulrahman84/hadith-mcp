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
      limit: { type: "string" },
      check: { type: "boolean" },
      "max-stale-ratio": { type: "string" }
    }
  });

  const sourceDbPath = path.resolve(values.db ?? process.env.HADITH_MCP_DB_PATH ?? defaultDb);
  const outPath = path.resolve(values.out ?? process.env.HADITH_MCP_EMBEDDINGS_PATH ?? defaultOut);
  const batchSize = values["batch-size"] ? Number.parseInt(values["batch-size"], 10) : 32;
  const limit = values.limit ? Number.parseInt(values.limit, 10) : undefined;
  const provider = createEmbeddingProviderFromEnv();
  const indexModel = process.env.EMBEDDINGS_INDEX_MODEL?.trim() || undefined;

  if (values.check) {
    await checkIndex(sourceDbPath, outPath, indexModel ?? provider?.model, values["max-stale-ratio"]);
    return;
  }

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
    model: indexModel,
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

/**
 * Verifies that an existing index (for example one downloaded during a Docker build) matches the
 * source DB. Exits non-zero when more than --max-stale-ratio (default 0.01) of hadith lack a current vector.
 */
async function checkIndex(sourceDbPath: string, outPath: string, model: string | undefined, maxStaleRatio: string | undefined): Promise<void> {
  if (!model) {
    throw new Error("Set EMBEDDINGS_INDEX_MODEL or EMBEDDINGS_MODEL to the model the index was built with.");
  }

  const ratioLimit = maxStaleRatio === undefined ? 0.01 : Number.parseFloat(maxStaleRatio);
  const result = await buildEmbeddingIndex({
    sourceDbPath,
    outPath,
    model,
    checkOnly: true,
    provider: {
      name: "check",
      model,
      embed: () => Promise.reject(new Error("check mode does not embed."))
    }
  });
  const pending = result.pending ?? 0;
  const ratio = result.total === 0 ? 1 : pending / result.total;

  console.error(
    `Index check for ${model}: ${result.skipped} of ${result.total} hadith current, ${pending} missing or stale ` +
      `(${(ratio * 100).toFixed(2)}%), ${result.dims ?? "?"} dimensions.`
  );

  if (!(ratio <= ratioLimit)) {
    throw new Error(`More than ${(ratioLimit * 100).toFixed(2)}% of hadith are missing or stale in ${outPath}.`);
  }
}

main().catch((error: unknown) => {
  console.error("Embedding build failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
