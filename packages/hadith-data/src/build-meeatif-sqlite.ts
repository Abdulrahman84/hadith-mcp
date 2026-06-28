#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fetchMeeAtifBookInputs, normalizeMeeAtifBooks } from "./importers/meeatif.js";
import { createMeeAtifImportReport, renderMeeAtifImportReportMarkdown } from "./reports/meeatif-import-report.js";
import { buildSqliteFromRows } from "./sqlite/builder.js";
import { validateNormalizedRows } from "./index.js";

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
  const reportJsonOut = argValue("--report-json", "../../data/generated/hadith-meeatif-import-report.json");
  const reportMarkdownOut = argValue("--report-md", "../../data/generated/hadith-meeatif-import-report.md");
  const info = await fetchJson<HuggingFaceDatasetInfo>("https://huggingface.co/api/datasets/meeAtif/hadith_datasets");
  const books = await fetchMeeAtifBookInputs(ref);
  const datasetVersion = info.sha ?? ref;
  const datasetUrl = "https://huggingface.co/datasets/meeAtif/hadith_datasets";
  const licenseNote =
    "Hugging Face metadata declares MIT; project owner accepted source-chain risk for local v1 candidate build.";
  const normalized = normalizeMeeAtifBooks({
    books,
    datasetVersion,
    datasetUrl,
    licenseNote
  });
  const sqliteValidation = validateNormalizedRows(normalized.rows);

  const result = await buildSqliteFromRows({
    rows: normalized.rows,
    outputPath: path.resolve(out),
    allowWarnings: true
  });
  const report = createMeeAtifImportReport({
    rows: normalized.rows,
    importWarnings: normalized.warnings,
    sqliteWarnings: sqliteValidation.warnings,
    sqliteReleaseBlockers: sqliteValidation.release_blockers,
    datasetVersion,
    datasetUrl,
    licenseNote
  });
  const reportJsonPath = path.resolve(reportJsonOut);
  const reportMarkdownPath = path.resolve(reportMarkdownOut);

  await mkdir(path.dirname(reportJsonPath), { recursive: true });
  await mkdir(path.dirname(reportMarkdownPath), { recursive: true });
  await writeFile(reportJsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(reportMarkdownPath, renderMeeAtifImportReportMarkdown(report), "utf8");

  console.log(`Wrote ${result.output_path}`);
  console.log(`Wrote ${reportJsonPath}`);
  console.log(`Wrote ${reportMarkdownPath}`);
  console.log(`Rows: ${result.row_count}`);
  console.log(`Import warnings: ${normalized.warnings.length}`);
  console.log(`SQLite validation warnings: ${result.warning_count}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
