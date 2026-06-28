#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { parse } from "csv-parse";
import {
  auditCsvRecords,
  auditOpenHadithBook,
  buildOpenHadithDataReport,
  openHadithSixBooks,
  renderOpenHadithDataMarkdown,
  type OpenHadithCsvAudit
} from "./audit/open-hadith-data.js";

type GitHubContent = {
  name: string;
  path: string;
  sha: string;
  size: number;
  download_url: string | null;
  type: string;
};

const repo = "mhashim6/Open-Hadith-Data";
const upstreamRepo = "ceefour/hadith-islamware";

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

async function resolveCommit(repository: string, ref: string): Promise<string | null> {
  const response = await fetch(`https://api.github.com/repos/${repository}/commits/${encodeURIComponent(ref)}`);
  if (!response.ok) {
    return null;
  }
  const payload = (await response.json()) as { sha?: string };
  return payload.sha ?? null;
}

async function parseCsvFromUrl(url: string): Promise<{ records: string[][]; sha256: string }> {
  const response = await fetch(url);
  if (!response.ok || response.body === null) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  const hash = createHash("sha256");
  const records: string[][] = [];
  const parser = parse({
    relax_quotes: true,
    relax_column_count: true,
    skip_empty_lines: true
  });

  parser.on("readable", () => {
    let record: string[] | null;
    while ((record = parser.read() as string[] | null) !== null) {
      records.push(record);
    }
  });

  await new Promise<void>((resolve, reject) => {
    const stream = Readable.fromWeb(response.body as never);
    stream.on("data", (chunk: Buffer) => hash.update(chunk));
    stream.on("error", reject);
    parser.on("error", reject);
    parser.on("end", resolve);
    stream.pipe(parser);
  });

  return { records, sha256: hash.digest("hex") };
}

async function auditCsv(file: GitHubContent): Promise<OpenHadithCsvAudit> {
  if (file.download_url === null) {
    throw new Error(`No download_url for ${file.path}`);
  }

  const { records, sha256 } = await parseCsvFromUrl(file.download_url);
  return auditCsvRecords({
    path: file.path,
    url: file.download_url,
    sizeBytes: file.size,
    sha: sha256,
    records
  });
}

async function main(): Promise<void> {
  const ref = argValue("--ref", "master");
  const outDir = argValue("--out-dir", "../../data/generated");
  const commit = await resolveCommit(repo, ref);
  const upstreamCommit = await resolveCommit(upstreamRepo, "master");

  const books = [];
  for (const book of openHadithSixBooks) {
    const contents = await fetchJson<GitHubContent[]>(
      `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(book.folder)}?ref=${encodeURIComponent(ref)}`
    );
    const plainFile = contents.find((item) => item.name === book.plainFile) ?? null;
    const diacritizedFile = contents.find((item) => item.name === book.diacritizedFile) ?? null;

    books.push(
      auditOpenHadithBook({
        book: book.key,
        displayName: book.displayName,
        folder: book.folder,
        plain: plainFile === null ? null : await auditCsv(plainFile),
        diacritized: diacritizedFile === null ? null : await auditCsv(diacritizedFile)
      })
    );
  }

  const report = buildOpenHadithDataReport({
    generatedAt: new Date().toISOString(),
    ref,
    commit,
    upstreamCommit,
    books
  });

  await mkdir(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "open-hadith-data-audit.json");
  const markdownPath = path.join(outDir, "open-hadith-data-audit.md");
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(markdownPath, renderOpenHadithDataMarkdown(report), "utf8");

  console.log(`Wrote ${jsonPath}`);
  console.log(`Wrote ${markdownPath}`);
  console.log(`Release blockers: ${report.summary.total_release_blockers}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
