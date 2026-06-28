import { execFileSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { normalizedFixtureRows } from "../../src/fixtures/normalized.js";
import { buildSqliteFromRows, type NormalizedHadithSqliteRow } from "../../src/index.js";

function sqliteJson<T>(dbPath: string, sql: string): T[] {
  const output = execFileSync("sqlite3", ["-json", dbPath, sql], { encoding: "utf8" });
  return output.trim().length === 0 ? [] : (JSON.parse(output) as T[]);
}

async function withTempDb<T>(fn: (dbPath: string) => Promise<T>): Promise<T> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "hadith-mcp-test-"));
  const dbPath = path.join(tempDir, "fixture.sqlite");

  try {
    return await fn(dbPath);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

describe("buildSqliteFromRows", () => {
  it("creates normalized tables and FTS5 rows from fixture data", async () => {
    await withTempDb(async (dbPath) => {
      const result = await buildSqliteFromRows({
        rows: normalizedFixtureRows,
        outputPath: dbPath,
        allowWarnings: true
      });

      expect(result.row_count).toBe(3);
      expect(result.blocked).toBe(false);

      const collections = sqliteJson<{ collection: string; display_name: string }>(
        dbPath,
        "SELECT collection, display_name FROM collections ORDER BY collection;"
      );
      expect(collections).toEqual([
        { collection: "bukhari", display_name: "Sahih al-Bukhari" },
        { collection: "muslim", display_name: "Sahih Muslim" },
        { collection: "tirmidhi", display_name: "Jami at-Tirmidhi" }
      ]);

      const textCounts = sqliteJson<{ language: string; count: number }>(
        dbPath,
        "SELECT language, count(*) AS count FROM hadith_texts GROUP BY language ORDER BY language;"
      );
      expect(textCounts).toEqual([
        { language: "arabic", count: 3 },
        { language: "english", count: 3 }
      ]);

      const ftsMatches = sqliteJson<{ collection: string; hadith_number: string; language: string }>(
        dbPath,
        "SELECT collection, hadith_number, language FROM hadith_texts_fts WHERE hadith_texts_fts MATCH 'Tirmidhi' ORDER BY language;"
      );
      expect(ftsMatches).toEqual([{ collection: "tirmidhi", hadith_number: "1", language: "english" }]);

      const grades = sqliteJson<{ grade_value: string; grader: string }>(
        dbPath,
        "SELECT grade_value, grader FROM hadith_grades;"
      );
      expect(grades).toEqual([{ grade_value: "fixture-grade", grader: "fixture grader" }]);
    });
  });

  it("blocks SQLite builds with missing Arabic text", async () => {
    await withTempDb(async (dbPath) => {
      const badRows: NormalizedHadithSqliteRow[] = [
        {
          ...normalizedFixtureRows[0]!,
          arabic_text: ""
        }
      ];

      await expect(buildSqliteFromRows({ rows: badRows, outputPath: dbPath, allowWarnings: true })).rejects.toThrow(
        /missing_arabic/
      );
    });
  });

  it("blocks SQLite builds with missing source provenance", async () => {
    await withTempDb(async (dbPath) => {
      const badRows: NormalizedHadithSqliteRow[] = [
        {
          ...normalizedFixtureRows[0]!,
          source_dataset: ""
        }
      ];

      await expect(buildSqliteFromRows({ rows: badRows, outputPath: dbPath, allowWarnings: true })).rejects.toThrow(
        /missing_source/
      );
    });
  });

  it("blocks SQLite builds with unattributed grades", async () => {
    await withTempDb(async (dbPath) => {
      const badRows: NormalizedHadithSqliteRow[] = [
        {
          ...normalizedFixtureRows[2]!,
          grade: {
            value: "fixture-grade",
            source: "",
            source_reference: ""
          }
        }
      ];

      await expect(buildSqliteFromRows({ rows: badRows, outputPath: dbPath, allowWarnings: true })).rejects.toThrow(
        /unattributed_grade/
      );
    });
  });
});
