import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { validateNormalizedRows, type ImportWarning, type NormalizedHadithRow } from "../index.js";
import { sqliteSchemaSql } from "./schema.js";

export type NormalizedHadithSqliteRow = NormalizedHadithRow & {
  display_name: string;
  book_number: string | null;
  book: string | null;
  chapter_number: string | null;
  chapter: string | null;
  source_dataset_version: string;
  source_dataset_url: string;
  source_license_note: string;
  provenance_note: string;
};

export type SqliteBuildResult = {
  output_path: string;
  row_count: number;
  warning_count: number;
  release_blocker_count: number;
  blocked: boolean;
};

export function contentHash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function sqlString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function sqlNullable(value: string | null): string {
  return value === null ? "NULL" : sqlString(value);
}

function assertNoReleaseBlockers(warnings: ImportWarning[]): void {
  if (warnings.length > 0) {
    const message = warnings.map((warning) => `${warning.code}:${warning.collection}:${warning.hadith_number}`).join(", ");
    throw new Error(`SQLite build blocked by release blockers: ${message}`);
  }
}

function sourceDatasetKey(row: NormalizedHadithSqliteRow): string {
  return [
    row.source_dataset,
    row.source_dataset_version,
    row.source_dataset_url,
    row.source_license_note,
    contentHash(`${row.source_dataset}:${row.source_dataset_version}:${row.source_dataset_url}`)
  ].join("\u001f");
}

function insertSourceDatasets(rows: NormalizedHadithSqliteRow[]): string {
  const seen = new Map<string, NormalizedHadithSqliteRow>();
  for (const row of rows) {
    seen.set(sourceDatasetKey(row), row);
  }

  return [...seen.values()]
    .map((row) => {
      const hash = contentHash(`${row.source_dataset}:${row.source_dataset_version}:${row.source_dataset_url}`);
      return [
        "INSERT OR IGNORE INTO source_datasets (name, version, url, license_note, content_hash) VALUES",
        `(${sqlString(row.source_dataset)}, ${sqlString(row.source_dataset_version)}, ${sqlString(row.source_dataset_url)}, ${sqlString(row.source_license_note)}, ${sqlString(hash)});`
      ].join(" ");
    })
    .join("\n");
}

function insertCollections(rows: NormalizedHadithSqliteRow[]): string {
  const collections = new Map<string, NormalizedHadithSqliteRow>();
  for (const row of rows) {
    collections.set(row.collection, row);
  }

  return [...collections.values()]
    .map((row) =>
      [
        "INSERT OR IGNORE INTO collections (collection, display_name, source_dataset_id)",
        "SELECT",
        `${sqlString(row.collection)}, ${sqlString(row.display_name)}, id`,
        "FROM source_datasets",
        `WHERE name = ${sqlString(row.source_dataset)} AND version = ${sqlString(row.source_dataset_version)};`
      ].join(" ")
    )
    .join("\n");
}

function insertBooks(rows: NormalizedHadithSqliteRow[]): string {
  const books = new Map<string, NormalizedHadithSqliteRow>();
  for (const row of rows) {
    if (row.book_number !== null || row.book !== null) {
      books.set(`${row.collection}:${row.book_number ?? ""}`, row);
    }
  }

  return [...books.values()]
    .map((row) =>
      [
        "INSERT OR IGNORE INTO books (collection_id, book_number, title)",
        "SELECT collections.id,",
        `${sqlNullable(row.book_number)}, ${sqlNullable(row.book)}`,
        "FROM collections",
        `WHERE collections.collection = ${sqlString(row.collection)};`
      ].join(" ")
    )
    .join("\n");
}

function insertChapters(rows: NormalizedHadithSqliteRow[]): string {
  const chapters = new Map<string, NormalizedHadithSqliteRow>();
  for (const row of rows) {
    if (row.chapter_number !== null || row.chapter !== null) {
      chapters.set(`${row.collection}:${row.book_number ?? ""}:${row.chapter_number ?? ""}`, row);
    }
  }

  return [...chapters.values()]
    .map((row) =>
      [
        "INSERT OR IGNORE INTO chapters (collection_id, book_id, chapter_number, title)",
        "SELECT collections.id, books.id,",
        `${sqlNullable(row.chapter_number)}, ${sqlNullable(row.chapter)}`,
        "FROM collections",
        "LEFT JOIN books ON books.collection_id = collections.id",
        row.book_number === null ? "AND books.book_number IS NULL" : `AND books.book_number = ${sqlString(row.book_number)}`,
        `WHERE collections.collection = ${sqlString(row.collection)};`
      ].join(" ")
    )
    .join("\n");
}

function insertHadiths(rows: NormalizedHadithSqliteRow[]): string {
  return rows
    .map((row) =>
      [
        "INSERT INTO hadiths (collection_id, hadith_number, book_id, chapter_id, source_url_or_reference)",
        "SELECT collections.id,",
        `${sqlString(row.hadith_number)}, books.id, chapters.id, ${sqlString(row.source_url_or_reference)}`,
        "FROM collections",
        "LEFT JOIN books ON books.collection_id = collections.id",
        row.book_number === null ? "AND books.book_number IS NULL" : `AND books.book_number = ${sqlString(row.book_number)}`,
        "LEFT JOIN chapters ON chapters.collection_id = collections.id",
        row.chapter_number === null
          ? "AND chapters.chapter_number IS NULL"
          : `AND chapters.chapter_number = ${sqlString(row.chapter_number)}`,
        `WHERE collections.collection = ${sqlString(row.collection)};`
      ].join(" ")
    )
    .join("\n");
}

function insertTexts(rows: NormalizedHadithSqliteRow[]): string {
  return rows
    .flatMap((row) => {
      const textRows = [
        { language: "arabic", text: row.arabic_text },
        ...(row.english_text === null ? [] : [{ language: "english", text: row.english_text }])
      ];

      return textRows.map((textRow) =>
        [
          "INSERT INTO hadith_texts (hadith_id, language, text, source_dataset_id, import_hash)",
          "SELECT hadiths.id,",
          `${sqlString(textRow.language)}, ${sqlString(textRow.text)}, source_datasets.id, ${sqlString(contentHash(textRow.text))}`,
          "FROM hadiths",
          "JOIN collections ON collections.id = hadiths.collection_id",
          "JOIN source_datasets ON source_datasets.name =",
          sqlString(row.source_dataset),
          "AND source_datasets.version =",
          sqlString(row.source_dataset_version),
          `WHERE collections.collection = ${sqlString(row.collection)} AND hadiths.hadith_number = ${sqlString(row.hadith_number)};`
        ].join(" ")
      );
    })
    .join("\n");
}

function insertGrades(rows: NormalizedHadithSqliteRow[]): string {
  return rows
    .filter((row) => row.grade !== null)
    .map((row) => {
      const grade = row.grade;
      if (grade === null) {
        throw new Error("unreachable grade state");
      }

      return [
        "INSERT INTO hadith_grades (hadith_id, grade_value, grader, source_reference, provenance_note)",
        "SELECT hadiths.id,",
        `${sqlString(grade.value)}, ${sqlString(grade.source)}, ${sqlString(grade.source_reference)}, ${sqlString(row.provenance_note)}`,
        "FROM hadiths",
        "JOIN collections ON collections.id = hadiths.collection_id",
        `WHERE collections.collection = ${sqlString(row.collection)} AND hadiths.hadith_number = ${sqlString(row.hadith_number)};`
      ].join(" ");
    })
    .join("\n");
}

function insertFtsRows(): string {
  return `
INSERT INTO hadith_texts_fts (hadith_text_id, collection, hadith_number, language, text)
SELECT hadith_texts.id, collections.collection, hadiths.hadith_number, hadith_texts.language, hadith_texts.text
FROM hadith_texts
JOIN hadiths ON hadiths.id = hadith_texts.hadith_id
JOIN collections ON collections.id = hadiths.collection_id;
`;
}

function insertWarnings(warnings: ImportWarning[]): string {
  return warnings
    .map(
      (warning) =>
        `INSERT INTO import_warnings (code, collection, hadith_number, message) VALUES (${sqlString(warning.code)}, ${sqlString(warning.collection)}, ${sqlString(warning.hadith_number)}, ${sqlString(warning.message)});`
    )
    .join("\n");
}

export function renderBuildSql(rows: NormalizedHadithSqliteRow[], warnings: ImportWarning[]): string {
  return [
    sqliteSchemaSql,
    "BEGIN;",
    insertSourceDatasets(rows),
    insertCollections(rows),
    insertBooks(rows),
    insertChapters(rows),
    insertHadiths(rows),
    insertTexts(rows),
    insertGrades(rows),
    insertWarnings(warnings),
    insertFtsRows(),
    "COMMIT;",
    "PRAGMA optimize;"
  ].join("\n");
}

export async function buildSqliteFromRows(args: {
  rows: NormalizedHadithSqliteRow[];
  outputPath: string;
  allowWarnings?: boolean | undefined;
}): Promise<SqliteBuildResult> {
  const report = validateNormalizedRows(args.rows);
  assertNoReleaseBlockers(report.release_blockers);

  if (!args.allowWarnings && report.warnings.length > 0) {
    throw new Error(`SQLite build has warnings; pass allowWarnings to continue.`);
  }

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "hadith-mcp-sqlite-"));
  const sqlPath = path.join(tempDir, "build.sql");

  try {
    await rm(args.outputPath, { force: true });
    await writeFile(sqlPath, renderBuildSql(args.rows, report.warnings), "utf8");
    execFileSync("sqlite3", [args.outputPath, `.read ${sqlPath}`], { stdio: "pipe" });

    return {
      output_path: args.outputPath,
      row_count: args.rows.length,
      warning_count: report.warnings.length,
      release_blocker_count: report.release_blockers.length,
      blocked: false
    };
  } finally {
    await rm(tempDir, { force: true, recursive: true });
  }
}
