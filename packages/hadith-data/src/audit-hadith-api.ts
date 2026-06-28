#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  auditBook,
  auditEdition,
  buildAuditReport,
  renderAuditMarkdown,
  sixBooks,
  type HadithApiEditionFile,
  type HadithApiEditionMetadata
} from "./audit/hadith-api.js";

type EditionsJson = Record<
  string,
  {
    name: string;
    collection: HadithApiEditionMetadata[];
  }
>;

const repo = "fawazahmed0/hadith-api";

function argValue(name: string, fallback: string): string {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return fallback;
  }
  return process.argv[index + 1] ?? fallback;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

async function resolveCommit(ref: string): Promise<string | null> {
  const response = await fetch(`https://api.github.com/repos/${repo}/commits/${encodeURIComponent(ref)}`);
  if (!response.ok) {
    return null;
  }
  const payload = (await response.json()) as { sha?: string };
  return payload.sha ?? null;
}

function rawUrl(ref: string, filePath: string): string {
  return `https://raw.githubusercontent.com/${repo}/${encodeURIComponent(ref)}/${filePath}`;
}

async function main(): Promise<void> {
  const ref = argValue("--ref", "1");
  const outDir = argValue("--out-dir", "data/generated");
  const commit = await resolveCommit(ref);
  const editions = await fetchJson<EditionsJson>(rawUrl(ref, "editions.json"));
  await fetchText(rawUrl(ref, "References.md"));
  await fetchText(rawUrl(ref, "LICENSE"));

  const books = [];
  for (const book of sixBooks) {
    const metadata = editions[book.key];
    const arabicMetadata = metadata?.collection.find((edition) => edition.name === book.arabicEdition) ?? null;
    const englishMetadata = metadata?.collection.find((edition) => edition.name === book.englishEdition) ?? null;
    const arabic =
      arabicMetadata === null
        ? null
        : auditEdition(arabicMetadata, await fetchJson<HadithApiEditionFile>(rawUrl(ref, `editions/${book.arabicEdition}.min.json`)));
    const english =
      englishMetadata === null
        ? null
        : auditEdition(englishMetadata, await fetchJson<HadithApiEditionFile>(rawUrl(ref, `editions/${book.englishEdition}.min.json`)));

    books.push(
      auditBook({
        book: book.key,
        displayName: book.displayName,
        arabic,
        english
      })
    );
  }

  const report = buildAuditReport({
    generatedAt: new Date().toISOString(),
    ref,
    commit,
    books
  });

  await mkdir(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "hadith-api-audit.json");
  const markdownPath = path.join(outDir, "hadith-api-audit.md");
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(markdownPath, renderAuditMarkdown(report), "utf8");

  console.log(`Wrote ${jsonPath}`);
  console.log(`Wrote ${markdownPath}`);
  console.log(`Release blockers: ${report.summary.total_release_blockers}`);

  if (hasFlag("--fail-on-blockers") && !report.summary.can_bundle_v1_data) {
    process.exitCode = 2;
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
