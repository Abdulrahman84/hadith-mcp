#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  auditMeeAtifBook,
  buildMeeAtifReport,
  meeAtifSixBooks,
  renderMeeAtifMarkdown,
  type MeeAtifRow
} from "./audit/meeatif-hadith-datasets.js";

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

function fileUrl(ref: string, file: string): string {
  return `https://huggingface.co/datasets/meeAtif/hadith_datasets/resolve/${encodeURIComponent(ref)}/${encodeURIComponent(file)}`;
}

async function main(): Promise<void> {
  const ref = argValue("--ref", "main");
  const outDir = argValue("--out-dir", "../../data/generated");
  const info = await fetchJson<HuggingFaceDatasetInfo>("https://huggingface.co/api/datasets/meeAtif/hadith_datasets");

  const books = [];
  for (const book of meeAtifSixBooks) {
    const rows = await fetchJson<MeeAtifRow[]>(fileUrl(ref, book.file));
    books.push(
      auditMeeAtifBook({
        book: book.key,
        displayName: book.displayName,
        file: book.file,
        rows
      })
    );
  }

  const report = buildMeeAtifReport({
    generatedAt: new Date().toISOString(),
    ref,
    commit: info.sha ?? null,
    books
  });

  await mkdir(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "meeatif-hadith-datasets-audit.json");
  const markdownPath = path.join(outDir, "meeatif-hadith-datasets-audit.md");
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(markdownPath, renderMeeAtifMarkdown(report), "utf8");

  console.log(`Wrote ${jsonPath}`);
  console.log(`Wrote ${markdownPath}`);
  console.log(`Release blockers: ${report.summary.total_release_blockers}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
