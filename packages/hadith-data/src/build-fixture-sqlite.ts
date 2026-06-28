#!/usr/bin/env node
import path from "node:path";
import { buildSqliteFromRows } from "./sqlite/builder.js";
import { normalizedFixtureRows } from "./fixtures/normalized.js";

function argValue(name: string, fallback: string): string {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return fallback;
  }
  return process.argv[index + 1] ?? fallback;
}

async function main(): Promise<void> {
  const out = argValue("--out", "../../data/generated/hadith-fixture.sqlite");
  const result = await buildSqliteFromRows({
    rows: normalizedFixtureRows,
    outputPath: path.resolve(out),
    allowWarnings: true
  });

  console.log(`Wrote ${result.output_path}`);
  console.log(`Rows: ${result.row_count}`);
  console.log(`Warnings: ${result.warning_count}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
