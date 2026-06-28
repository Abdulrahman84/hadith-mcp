#!/usr/bin/env node
import path from "node:path";
import { fetchMeeAtifBookInputs, normalizeMeeAtifBooks } from "./importers/meeatif.js";
import { buildSqliteFromRows } from "./sqlite/builder.js";

type HuggingFaceDatasetInfo = {
  sha?: string;
};

function argValue(name: string, fallback: string): string {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return fallback;
  }
  return process.argv[index + 1] ?? fallback;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

async function main(): Promise<void> {
  const ref = argValue("--ref", "main");
  const out = argValue("--out", "../../data/generated/hadith-meeatif.sqlite");
  const info = await fetchJson<HuggingFaceDatasetInfo>("https://huggingface.co/api/datasets/meeAtif/hadith_datasets");
  const books = await fetchMeeAtifBookInputs(ref);
  const normalized = normalizeMeeAtifBooks({
    books,
    datasetVersion: info.sha ?? ref,
    datasetUrl: "https://huggingface.co/datasets/meeAtif/hadith_datasets",
    licenseNote:
      "Hugging Face metadata declares MIT; project owner accepted source-chain risk for local v1 candidate build."
  });

  const result = await buildSqliteFromRows({
    rows: normalized.rows,
    outputPath: path.resolve(out),
    allowWarnings: true
  });

  console.log(`Wrote ${result.output_path}`);
  console.log(`Rows: ${result.row_count}`);
  console.log(`Import warnings: ${normalized.warnings.length}`);
  console.log(`SQLite validation warnings: ${result.warning_count}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
