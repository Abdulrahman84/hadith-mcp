#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  buildMaktabaGradesReport,
  maktabaGradeSources,
  renderMaktabaGradesMarkdown,
  type MaktabaGradeSource
} from "./audit/maktaba-grades-backup.js";

type GitHubTree = {
  tree?: { path: string; type: string }[];
};

type GitHubContent = {
  name: string;
};

const repo = "fawazahmed0/maktaba-grades-backup";

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

async function resolveCommit(ref: string): Promise<string | null> {
  const response = await fetch(`https://api.github.com/repos/${repo}/commits/${encodeURIComponent(ref)}`);
  if (!response.ok) {
    return null;
  }
  const payload = (await response.json()) as { sha?: string };
  return payload.sha ?? null;
}

async function main(): Promise<void> {
  const ref = argValue("--ref", "main");
  const outDir = argValue("--out-dir", "../../data/generated");
  const commit = await resolveCommit(ref);
  const tree = await fetchJson<GitHubTree>(
    `https://api.github.com/repos/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`
  );
  const root = await fetchJson<GitHubContent[]>(`https://api.github.com/repos/${repo}/contents?ref=${encodeURIComponent(ref)}`);
  const paths = tree.tree?.map((item) => item.path) ?? [];
  const sources: MaktabaGradeSource[] = maktabaGradeSources.map((source) => ({
    ...source,
    file_count: paths.filter((item) => item.startsWith(`${source.book_id}/`) && item.endsWith(".html")).length,
    index_file_present: paths.includes(`${source.book_id}.html`)
  }));
  const licensePresent = root.some((item) => item.name.toLowerCase().startsWith("license"));
  const report = buildMaktabaGradesReport({
    generatedAt: new Date().toISOString(),
    ref,
    commit,
    sources,
    licensePresent
  });

  await mkdir(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "maktaba-grades-backup-audit.json");
  const markdownPath = path.join(outDir, "maktaba-grades-backup-audit.md");
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(markdownPath, renderMaktabaGradesMarkdown(report), "utf8");

  console.log(`Wrote ${jsonPath}`);
  console.log(`Wrote ${markdownPath}`);
  console.log(`Release blockers: ${report.summary.total_release_blockers}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
