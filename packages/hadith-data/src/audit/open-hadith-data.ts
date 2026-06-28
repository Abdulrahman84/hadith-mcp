export type OpenHadithBookKey = "bukhari" | "muslim" | "abudawud" | "tirmidhi" | "nasai" | "ibnmaja";

export type OpenHadithCsvAudit = {
  path: string;
  url: string;
  size_bytes: number;
  sha: string;
  row_count: number;
  min_columns: number;
  max_columns: number;
  missing_number_count: number;
  missing_arabic_text_count: number;
  duplicate_numbers: string[];
  has_elaboration_column: boolean;
};

export type OpenHadithBookAudit = {
  book: OpenHadithBookKey;
  display_name: string;
  folder: string;
  plain: OpenHadithCsvAudit | null;
  diacritized: OpenHadithCsvAudit | null;
  count_match: boolean;
  blockers: string[];
  warnings: string[];
};

export type OpenHadithDataAuditReport = {
  generated_at: string;
  repository: string;
  ref: string;
  commit: string | null;
  license: {
    repository_license: string;
    license_url: string;
    contents_license: string;
    note: string;
  };
  upstream_source: {
    repository: string;
    commit: string | null;
    license_url: string;
    readme_note: string;
  };
  books: OpenHadithBookAudit[];
  summary: {
    books_expected: number;
    books_found: number;
    total_plain_rows: number;
    total_diacritized_rows: number;
    total_release_blockers: number;
    total_warnings: number;
    has_english: boolean;
    has_grades: boolean;
    can_bundle_v1_data: boolean;
  };
  release_blockers: string[];
  warnings: string[];
};

export const openHadithSixBooks: {
  key: OpenHadithBookKey;
  displayName: string;
  folder: string;
  plainFile: string;
  diacritizedFile: string;
}[] = [
  {
    key: "bukhari",
    displayName: "Sahih al-Bukhari",
    folder: "Sahih_Al-Bukhari",
    plainFile: "sahih_al-bukhari_ahadith.utf8.csv",
    diacritizedFile: "sahih_al-bukhari_ahadith_mushakkala_mufassala.utf8.csv"
  },
  {
    key: "muslim",
    displayName: "Sahih Muslim",
    folder: "Sahih_Muslim",
    plainFile: "sahih_muslim_ahadith.utf8.csv",
    diacritizedFile: "sahih_muslim_ahadith_mushakkala_mufassala.utf8.csv"
  },
  {
    key: "abudawud",
    displayName: "Sunan Abi Dawud",
    folder: "Sunan_Abu-Dawud",
    plainFile: "sunan_abu-dawud_ahadith.utf8.csv",
    diacritizedFile: "sunan_abu-dawud_ahadith_mushakkala_mufassala.utf8.csv"
  },
  {
    key: "tirmidhi",
    displayName: "Jami at-Tirmidhi",
    folder: "Sunan_Al-Tirmidhi",
    plainFile: "sunan_al-tirmidhi_ahadith.utf8.csv",
    diacritizedFile: "sunan_al-tirmidhi_ahadith_mushakkala_mufassala.utf8.csv"
  },
  {
    key: "nasai",
    displayName: "Sunan an-Nasa'i",
    folder: "Sunan_Al-Nasai",
    plainFile: "sunan_al-nasai_ahadith.utf8.csv",
    diacritizedFile: "sunan_al-nasai_ahadith_mushakkala_mufassala.utf8.csv"
  },
  {
    key: "ibnmaja",
    displayName: "Sunan Ibn Majah",
    folder: "Sunan_Ibn-Maja",
    plainFile: "sunan_ibn-maja_ahadith.utf8.csv",
    diacritizedFile: "sunan_ibn-maja_ahadith_mushakkala_mufassala.utf8.csv"
  }
];

export function auditCsvRecords(args: {
  path: string;
  url: string;
  sizeBytes: number;
  sha: string;
  records: string[][];
}): OpenHadithCsvAudit {
  const seenNumbers = new Set<string>();
  const duplicateNumbers = new Set<string>();
  let minColumns = Number.POSITIVE_INFINITY;
  let maxColumns = 0;
  let missingNumberCount = 0;
  let missingArabicTextCount = 0;
  let hasElaborationColumn = false;

  for (const record of args.records) {
    minColumns = Math.min(minColumns, record.length);
    maxColumns = Math.max(maxColumns, record.length);
    hasElaborationColumn = hasElaborationColumn || record.length >= 3;

    const number = record[0]?.trim() ?? "";
    if (number.length === 0) {
      missingNumberCount += 1;
    } else if (seenNumbers.has(number)) {
      duplicateNumbers.add(number);
    } else {
      seenNumbers.add(number);
    }

    if ((record[1]?.trim() ?? "").length === 0) {
      missingArabicTextCount += 1;
    }
  }

  return {
    path: args.path,
    url: args.url,
    size_bytes: args.sizeBytes,
    sha: args.sha,
    row_count: args.records.length,
    min_columns: Number.isFinite(minColumns) ? minColumns : 0,
    max_columns: maxColumns,
    missing_number_count: missingNumberCount,
    missing_arabic_text_count: missingArabicTextCount,
    duplicate_numbers: [...duplicateNumbers].sort((a, b) => Number(a) - Number(b)),
    has_elaboration_column: hasElaborationColumn
  };
}

export function auditOpenHadithBook(args: {
  book: OpenHadithBookKey;
  displayName: string;
  folder: string;
  plain: OpenHadithCsvAudit | null;
  diacritized: OpenHadithCsvAudit | null;
}): OpenHadithBookAudit {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (args.plain === null) {
    warnings.push("Missing plain no-diacritics CSV.");
  } else {
    if (args.plain.missing_arabic_text_count > 0) {
      blockers.push(`Plain CSV has ${args.plain.missing_arabic_text_count} rows with missing Arabic text.`);
    }
    if (args.plain.missing_number_count > 0) {
      blockers.push(`Plain CSV has ${args.plain.missing_number_count} rows with missing hadith number.`);
    }
    if (args.plain.duplicate_numbers.length > 0) {
      blockers.push("Plain CSV has duplicate hadith numbers.");
    }
  }

  if (args.diacritized === null) {
    blockers.push("Missing diacritized display CSV.");
  } else {
    if (args.diacritized.missing_arabic_text_count > 0) {
      blockers.push(`Diacritized CSV has ${args.diacritized.missing_arabic_text_count} rows with missing Arabic text.`);
    }
    if (args.diacritized.missing_number_count > 0) {
      blockers.push(`Diacritized CSV has ${args.diacritized.missing_number_count} rows with missing hadith number.`);
    }
    if (args.diacritized.duplicate_numbers.length > 0) {
      blockers.push("Diacritized CSV has duplicate hadith numbers.");
    }
  }

  const countMatch =
    args.plain !== null && args.diacritized !== null && args.plain.row_count === args.diacritized.row_count;
  if (args.plain !== null && args.diacritized !== null && !countMatch) {
    warnings.push(`Plain and diacritized row counts differ: ${args.plain.row_count} vs ${args.diacritized.row_count}.`);
  }

  return {
    book: args.book,
    display_name: args.displayName,
    folder: args.folder,
    plain: args.plain,
    diacritized: args.diacritized,
    count_match: countMatch,
    blockers,
    warnings
  };
}

export function buildOpenHadithDataReport(args: {
  generatedAt: string;
  ref: string;
  commit: string | null;
  upstreamCommit: string | null;
  books: OpenHadithBookAudit[];
}): OpenHadithDataAuditReport {
  const releaseBlockers = [
    "Source chain needs human review: Open-Hadith-Data says original CSV files came from hadith-islamware; hadith-islamware says data came from Islam Ware and lists Islam Ware copyright.",
    ...args.books.flatMap((book) => book.blockers.map((blocker) => `${book.book}: ${blocker}`))
  ];
  const warnings = [
    "Dataset is Arabic-only; English text would need a separate audited source.",
    "Dataset does not include source-attributed hadith grades; MCP grade responses must return grade null for this source.",
    ...args.books.flatMap((book) => book.warnings.map((warning) => `${book.book}: ${warning}`))
  ];

  return {
    generated_at: args.generatedAt,
    repository: "https://github.com/mhashim6/Open-Hadith-Data",
    ref: args.ref,
    commit: args.commit,
    license: {
      repository_license: "ODbL 1.0 with Database Contents License 1.0",
      license_url: "https://github.com/mhashim6/Open-Hadith-Data/blob/master/LICENSE",
      contents_license: "Database Contents License 1.0",
      note: "License is explicit, but the source chain still needs review before bundled redistribution."
    },
    upstream_source: {
      repository: "https://github.com/ceefour/hadith-islamware",
      commit: args.upstreamCommit,
      license_url: "https://github.com/ceefour/hadith-islamware/blob/master/LICENSE",
      readme_note: "hadith-islamware README says the database came from Islam Ware and lists Copyright (C) 2006-2014 Islam Ware."
    },
    books: args.books,
    summary: {
      books_expected: openHadithSixBooks.length,
      books_found: args.books.filter((book) => book.diacritized !== null).length,
      total_plain_rows: args.books.reduce((sum, book) => sum + (book.plain?.row_count ?? 0), 0),
      total_diacritized_rows: args.books.reduce((sum, book) => sum + (book.diacritized?.row_count ?? 0), 0),
      total_release_blockers: releaseBlockers.length,
      total_warnings: warnings.length,
      has_english: false,
      has_grades: false,
      can_bundle_v1_data: releaseBlockers.length === 0
    },
    release_blockers: releaseBlockers,
    warnings
  };
}

export function renderOpenHadithDataMarkdown(report: OpenHadithDataAuditReport): string {
  const lines = [
    "# Open-Hadith-Data Audit Report",
    "",
    `Generated: ${report.generated_at}`,
    "",
    `Repository: ${report.repository}`,
    "",
    `Ref: ${report.ref}`,
    "",
    `Commit: ${report.commit ?? "unknown"}`,
    "",
    "## Summary",
    "",
    `- Books expected: ${report.summary.books_expected}`,
    `- Books found with diacritized CSVs: ${report.summary.books_found}`,
    `- Total plain rows inspected: ${report.summary.total_plain_rows}`,
    `- Total diacritized rows inspected: ${report.summary.total_diacritized_rows}`,
    `- English translations included: ${report.summary.has_english ? "yes" : "no"}`,
    `- Grades included: ${report.summary.has_grades ? "yes" : "no"}`,
    `- Release blockers: ${report.summary.total_release_blockers}`,
    `- Warnings: ${report.summary.total_warnings}`,
    `- Can bundle v1 data: ${report.summary.can_bundle_v1_data ? "yes" : "no"}`,
    "",
    "## Book Coverage",
    "",
    "| Book | Plain CSV rows | Diacritized CSV rows | Counts match | Empty Arabic rows |",
    "| --- | ---: | ---: | --- | ---: |",
    ...report.books.map((book) => {
      const emptyArabic = (book.plain?.missing_arabic_text_count ?? 0) + (book.diacritized?.missing_arabic_text_count ?? 0);
      return `| ${book.display_name} | ${book.plain?.row_count ?? 0} | ${book.diacritized?.row_count ?? 0} | ${book.count_match ? "yes" : "no"} | ${emptyArabic} |`;
    }),
    "",
    "## Release Blockers",
    "",
    ...report.release_blockers.map((blocker) => `- ${blocker}`),
    "",
    "## Warnings",
    "",
    ...(report.warnings.length === 0 ? ["- None"] : report.warnings.map((warning) => `- ${warning}`)),
    "",
    "## Notes",
    "",
    "- This report intentionally does not store hadith text.",
    "- The diacritized CSV is the preferred display source if this dataset is eventually cleared.",
    "- The plain no-diacritics CSV can support search normalization.",
    "- Grades must be returned as null for this source unless a separate audited grade source is added."
  ];

  return `${lines.join("\n")}\n`;
}
