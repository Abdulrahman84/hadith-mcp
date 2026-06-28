export type NormalizedHadithRow = {
  collection: string;
  hadith_number: string;
  arabic_text: string;
  english_text: string | null;
  grade: {
    value: string;
    source: string;
    source_reference: string;
  } | null;
  source_dataset: string;
  source_url_or_reference: string;
};

export type ImportWarning = {
  code: "missing_arabic" | "missing_source" | "unattributed_grade" | "duplicate_reference";
  collection: string;
  hadith_number: string;
  message: string;
};

export type DataQualityReport = {
  total_rows: number;
  collections: Record<string, number>;
  warnings: ImportWarning[];
  release_blockers: ImportWarning[];
};

export function validateNormalizedRows(rows: NormalizedHadithRow[]): DataQualityReport {
  const collections: Record<string, number> = {};
  const warnings: ImportWarning[] = [];
  const seenReferences = new Set<string>();

  for (const row of rows) {
    collections[row.collection] = (collections[row.collection] ?? 0) + 1;

    const referenceKey = `${row.collection}:${row.hadith_number}`;
    if (seenReferences.has(referenceKey)) {
      warnings.push({
        code: "duplicate_reference",
        collection: row.collection,
        hadith_number: row.hadith_number,
        message: "Duplicate collection-local hadith reference."
      });
    }
    seenReferences.add(referenceKey);

    if (row.arabic_text.trim().length === 0) {
      warnings.push({
        code: "missing_arabic",
        collection: row.collection,
        hadith_number: row.hadith_number,
        message: "Arabic text is required for every imported hadith."
      });
    }

    if (row.source_dataset.trim().length === 0 || row.source_url_or_reference.trim().length === 0) {
      warnings.push({
        code: "missing_source",
        collection: row.collection,
        hadith_number: row.hadith_number,
        message: "Source dataset and source reference are required."
      });
    }

    if (row.grade !== null && (row.grade.source.trim().length === 0 || row.grade.source_reference.trim().length === 0)) {
      warnings.push({
        code: "unattributed_grade",
        collection: row.collection,
        hadith_number: row.hadith_number,
        message: "Grade must include source attribution before it can be exposed."
      });
    }
  }

  return {
    total_rows: rows.length,
    collections,
    warnings,
    release_blockers: warnings.filter((warning) =>
      ["missing_arabic", "missing_source", "unattributed_grade"].includes(warning.code)
    )
  };
}

export { buildSqliteFromRows, renderBuildSql, type NormalizedHadithSqliteRow, type SqliteBuildResult } from "./sqlite/builder.js";
export { sqliteSchemaSql } from "./sqlite/schema.js";
export { normalizeMeeAtifBooks, fetchMeeAtifBookInputs, type MeeAtifImportResult, type MeeAtifImportWarning } from "./importers/meeatif.js";
export {
  createMeeAtifImportReport,
  renderMeeAtifImportReportMarkdown,
  type CreateMeeAtifImportReportArgs,
  type MeeAtifImportReport
} from "./reports/meeatif-import-report.js";
