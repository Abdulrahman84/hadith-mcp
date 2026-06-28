import type { ImportWarning } from "../index.js";
import type { MeeAtifImportWarning } from "../importers/meeatif.js";
import type { NormalizedHadithSqliteRow } from "../sqlite/builder.js";

type CountMap = Record<string, number>;

export type MeeAtifImportReport = {
  generated_at: string;
  source_dataset: {
    name: string;
    version: string;
    url: string;
    license_note: string;
  };
  rows: {
    imported: number;
    skipped: number;
    by_collection: CountMap;
  };
  text_coverage: {
    arabic_rows: number;
    english_rows: number;
    missing_english_rows: number;
    missing_english_by_collection: CountMap;
  };
  grade_coverage: {
    graded_rows: number;
    ungraded_rows: number;
    graded_by_collection: CountMap;
    ungraded_by_collection: CountMap;
    grade_sources: CountMap;
  };
  import_warnings: {
    total: number;
    by_code: CountMap;
    by_collection: CountMap;
    samples: MeeAtifImportWarning[];
  };
  sqlite_validation: {
    total_warnings: number;
    release_blockers: number;
    by_code: CountMap;
    samples: ImportWarning[];
  };
  release_notes: string[];
};

export type CreateMeeAtifImportReportArgs = {
  rows: NormalizedHadithSqliteRow[];
  importWarnings: MeeAtifImportWarning[];
  sqliteWarnings: ImportWarning[];
  sqliteReleaseBlockers: ImportWarning[];
  datasetVersion: string;
  datasetUrl: string;
  licenseNote: string;
  generatedAt?: Date | undefined;
  sampleLimit?: number | undefined;
};

function increment(map: CountMap, key: string): void {
  map[key] = (map[key] ?? 0) + 1;
}

function sortedCountMap(map: CountMap): CountMap {
  return Object.fromEntries(Object.entries(map).sort(([left], [right]) => left.localeCompare(right)));
}

function countRowsByCollection(rows: NormalizedHadithSqliteRow[]): CountMap {
  const counts: CountMap = {};

  for (const row of rows) {
    increment(counts, row.collection);
  }

  return sortedCountMap(counts);
}

function countImportWarningsByCollection(warnings: MeeAtifImportWarning[]): CountMap {
  const counts: CountMap = {};

  for (const warning of warnings) {
    increment(counts, warning.collection);
  }

  return sortedCountMap(counts);
}

function countImportWarningsByCode(warnings: MeeAtifImportWarning[]): CountMap {
  const counts: CountMap = {};

  for (const warning of warnings) {
    increment(counts, warning.code);
  }

  return sortedCountMap(counts);
}

function countSqliteWarningsByCode(warnings: ImportWarning[]): CountMap {
  const counts: CountMap = {};

  for (const warning of warnings) {
    increment(counts, warning.code);
  }

  return sortedCountMap(counts);
}

function representativeSamples<T extends { code: string }>(warnings: T[], limit: number): T[] {
  const samples: T[] = [];
  const byCode = new Map<string, T[]>();

  for (const warning of warnings) {
    byCode.set(warning.code, [...(byCode.get(warning.code) ?? []), warning]);
  }

  for (const code of [...byCode.keys()].sort()) {
    const warning = byCode.get(code)?.[0];
    if (warning !== undefined) {
      samples.push(warning);
    }
  }

  for (const warning of warnings) {
    if (samples.length >= limit) {
      break;
    }

    if (!samples.includes(warning)) {
      samples.push(warning);
    }
  }

  return samples.slice(0, limit);
}

function gradeSourceCounts(rows: NormalizedHadithSqliteRow[]): CountMap {
  const counts: CountMap = {};

  for (const row of rows) {
    if (row.grade !== null) {
      increment(counts, row.grade.source);
    }
  }

  return sortedCountMap(counts);
}

function gradeCountsByCollection(rows: NormalizedHadithSqliteRow[], graded: boolean): CountMap {
  const counts: CountMap = {};

  for (const row of rows) {
    if ((row.grade !== null) === graded) {
      increment(counts, row.collection);
    }
  }

  return sortedCountMap(counts);
}

function missingEnglishByCollection(rows: NormalizedHadithSqliteRow[]): CountMap {
  const counts: CountMap = {};

  for (const row of rows) {
    if (row.english_text === null) {
      increment(counts, row.collection);
    }
  }

  return sortedCountMap(counts);
}

export function createMeeAtifImportReport(args: CreateMeeAtifImportReportArgs): MeeAtifImportReport {
  const sampleLimit = args.sampleLimit ?? 10;
  const skippedRows = args.importWarnings.filter((warning) => warning.code === "unparseable_reference").length;
  const englishRows = args.rows.filter((row) => row.english_text !== null).length;
  const gradedRows = args.rows.filter((row) => row.grade !== null).length;

  return {
    generated_at: (args.generatedAt ?? new Date()).toISOString(),
    source_dataset: {
      name: "meeAtif/hadith_datasets",
      version: args.datasetVersion,
      url: args.datasetUrl,
      license_note: args.licenseNote
    },
    rows: {
      imported: args.rows.length,
      skipped: skippedRows,
      by_collection: countRowsByCollection(args.rows)
    },
    text_coverage: {
      arabic_rows: args.rows.filter((row) => row.arabic_text.trim().length > 0).length,
      english_rows: englishRows,
      missing_english_rows: args.rows.length - englishRows,
      missing_english_by_collection: missingEnglishByCollection(args.rows)
    },
    grade_coverage: {
      graded_rows: gradedRows,
      ungraded_rows: args.rows.length - gradedRows,
      graded_by_collection: gradeCountsByCollection(args.rows, true),
      ungraded_by_collection: gradeCountsByCollection(args.rows, false),
      grade_sources: gradeSourceCounts(args.rows)
    },
    import_warnings: {
      total: args.importWarnings.length,
      by_code: countImportWarningsByCode(args.importWarnings),
      by_collection: countImportWarningsByCollection(args.importWarnings),
      samples: representativeSamples(args.importWarnings, sampleLimit)
    },
    sqlite_validation: {
      total_warnings: args.sqliteWarnings.length,
      release_blockers: args.sqliteReleaseBlockers.length,
      by_code: countSqliteWarningsByCode(args.sqliteWarnings),
      samples: representativeSamples(args.sqliteWarnings, sampleLimit)
    },
    release_notes: [
      "This report describes a local v1 candidate import, not a cleared bundled data release.",
      "Generated SQLite artifacts remain ignored by git until a later release decision includes the required data-license notice.",
      "Grades are source-attributed only; missing grades must be returned as grade null."
    ]
  };
}

function markdownCountTable(counts: CountMap, emptyLabel: string): string {
  const entries = Object.entries(counts);
  if (entries.length === 0) {
    return emptyLabel;
  }

  return ["| Key | Count |", "| --- | ---: |", ...entries.map(([key, count]) => `| ${key} | ${count} |`)].join("\n");
}

function warningReference(warning: { source_reference?: string; hadith_number?: string }): string {
  return warning.source_reference ?? warning.hadith_number ?? "unknown reference";
}

function markdownWarningSamples(
  warnings: { code: string; collection: string; source_reference?: string; hadith_number?: string; message: string }[]
): string {
  if (warnings.length === 0) {
    return "None.";
  }

  return warnings
    .map((warning) => `- ${warning.code} / ${warning.collection} / ${warningReference(warning)}: ${warning.message}`)
    .join("\n");
}

export function renderMeeAtifImportReportMarkdown(report: MeeAtifImportReport): string {
  return [
    "# meeAtif Import Report",
    "",
    `Generated: ${report.generated_at}`,
    "",
    `Dataset: ${report.source_dataset.name}`,
    "",
    `Version: ${report.source_dataset.version}`,
    "",
    `URL: ${report.source_dataset.url}`,
    "",
    `License note: ${report.source_dataset.license_note}`,
    "",
    "## Rows",
    "",
    `Imported rows: ${report.rows.imported}`,
    "",
    `Skipped rows: ${report.rows.skipped}`,
    "",
    markdownCountTable(report.rows.by_collection, "No imported rows."),
    "",
    "## Text Coverage",
    "",
    `Arabic rows: ${report.text_coverage.arabic_rows}`,
    "",
    `English rows: ${report.text_coverage.english_rows}`,
    "",
    `Missing English rows: ${report.text_coverage.missing_english_rows}`,
    "",
    markdownCountTable(report.text_coverage.missing_english_by_collection, "No missing English rows."),
    "",
    "## Grade Coverage",
    "",
    `Graded rows: ${report.grade_coverage.graded_rows}`,
    "",
    `Ungraded rows: ${report.grade_coverage.ungraded_rows}`,
    "",
    "### Graded By Collection",
    "",
    markdownCountTable(report.grade_coverage.graded_by_collection, "No graded rows."),
    "",
    "### Ungraded By Collection",
    "",
    markdownCountTable(report.grade_coverage.ungraded_by_collection, "No ungraded rows."),
    "",
    "### Grade Sources",
    "",
    markdownCountTable(report.grade_coverage.grade_sources, "No grade sources."),
    "",
    "## Import Warnings",
    "",
    `Total warnings: ${report.import_warnings.total}`,
    "",
    markdownCountTable(report.import_warnings.by_code, "No import warnings."),
    "",
    "### Warning Samples",
    "",
    markdownWarningSamples(report.import_warnings.samples),
    "",
    "## SQLite Validation",
    "",
    `Total warnings: ${report.sqlite_validation.total_warnings}`,
    "",
    `Release blockers: ${report.sqlite_validation.release_blockers}`,
    "",
    markdownCountTable(report.sqlite_validation.by_code, "No SQLite validation warnings."),
    "",
    "### Validation Warning Samples",
    "",
    markdownWarningSamples(report.sqlite_validation.samples),
    "",
    "## Release Notes",
    "",
    report.release_notes.map((note) => `- ${note}`).join("\n"),
    ""
  ].join("\n");
}
