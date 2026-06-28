export type MeeAtifBookKey = "bukhari" | "muslim" | "abudawud" | "tirmidhi" | "nasai" | "ibnmajah";

export type MeeAtifRow = {
  Book?: string;
  Chapter_Number?: number | string;
  Chapter_Title_Arabic?: string;
  Chapter_Title_English?: string;
  Arabic_Text?: string;
  English_Text?: string;
  Grade?: string;
  Reference?: string;
  "In-book reference"?: string;
};

export type MeeAtifBookAudit = {
  book: MeeAtifBookKey;
  display_name: string;
  file: string;
  row_count: number;
  missing_arabic_count: number;
  missing_english_count: number;
  missing_grade_count: number;
  missing_reference_count: number;
  sunnah_reference_count: number;
  grade_sources: string[];
  grade_values: string[];
  blockers: string[];
  warnings: string[];
};

export type MeeAtifAuditReport = {
  generated_at: string;
  repository: string;
  ref: string;
  commit: string | null;
  license: {
    metadata_license: string;
    note: string;
  };
  books: MeeAtifBookAudit[];
  summary: {
    books_expected: number;
    books_found: number;
    total_rows: number;
    total_missing_arabic: number;
    total_missing_english: number;
    total_missing_grades: number;
    total_sunnah_references: number;
    grade_sources: string[];
    total_release_blockers: number;
    total_warnings: number;
    can_bundle_v1_data: boolean;
  };
  release_blockers: string[];
  warnings: string[];
};

export const meeAtifSixBooks: { key: MeeAtifBookKey; displayName: string; file: string }[] = [
  { key: "bukhari", displayName: "Sahih al-Bukhari", file: "Sahih al-Bukhari.json" },
  { key: "muslim", displayName: "Sahih Muslim", file: "Sahih Muslim.json" },
  { key: "abudawud", displayName: "Sunan Abi Dawud", file: "Sunan Abi Dawud.json" },
  { key: "tirmidhi", displayName: "Jami at-Tirmidhi", file: "Jami` at-Tirmidhi.json" },
  { key: "nasai", displayName: "Sunan an-Nasa'i", file: "Sunan an-Nasa'i.json" },
  { key: "ibnmajah", displayName: "Sunan Ibn Majah", file: "Sunan Ibn Majah.json" }
];

function extractGradeSource(grade: string): string | null {
  const match = grade.match(/\(([^)]+)\)\s*$/);
  return match?.[1]?.trim() ?? null;
}

function extractGradeValue(grade: string): string {
  return grade.replace(/\s*\([^)]+\)\s*$/, "").trim();
}

export function auditMeeAtifBook(args: {
  book: MeeAtifBookKey;
  displayName: string;
  file: string;
  rows: MeeAtifRow[];
}): MeeAtifBookAudit {
  const gradeSources = new Set<string>();
  const gradeValues = new Set<string>();
  let missingArabic = 0;
  let missingEnglish = 0;
  let missingGrade = 0;
  let missingReference = 0;
  let sunnahReferenceCount = 0;

  for (const row of args.rows) {
    if ((row.Arabic_Text?.trim() ?? "").length === 0) {
      missingArabic += 1;
    }
    if ((row.English_Text?.trim() ?? "").length === 0) {
      missingEnglish += 1;
    }

    const grade = row.Grade?.trim() ?? "";
    if (grade.length === 0) {
      missingGrade += 1;
    } else {
      const source = extractGradeSource(grade);
      if (source !== null) {
        gradeSources.add(source);
      }
      gradeValues.add(extractGradeValue(grade));
    }

    const reference = row.Reference?.trim() ?? "";
    if (reference.length === 0) {
      missingReference += 1;
    } else if (reference.includes("sunnah.com")) {
      sunnahReferenceCount += 1;
    }
  }

  const blockers: string[] = [];
  const warnings: string[] = [];
  if (missingArabic > 0) {
    blockers.push(`${missingArabic} rows are missing Arabic text.`);
  }
  if (missingEnglish > 0) {
    warnings.push(`${missingEnglish} rows are missing English text.`);
  }
  if (missingReference > 0) {
    blockers.push(`${missingReference} rows are missing source reference links.`);
  }
  if (missingGrade > 0) {
    warnings.push(`${missingGrade} rows have no grade; MCP must return grade null for those records.`);
  }

  return {
    book: args.book,
    display_name: args.displayName,
    file: args.file,
    row_count: args.rows.length,
    missing_arabic_count: missingArabic,
    missing_english_count: missingEnglish,
    missing_grade_count: missingGrade,
    missing_reference_count: missingReference,
    sunnah_reference_count: sunnahReferenceCount,
    grade_sources: [...gradeSources].sort(),
    grade_values: [...gradeValues].sort(),
    blockers,
    warnings
  };
}

export function buildMeeAtifReport(args: {
  generatedAt: string;
  ref: string;
  commit: string | null;
  books: MeeAtifBookAudit[];
}): MeeAtifAuditReport {
  const gradeSources = new Set(args.books.flatMap((book) => book.grade_sources));
  const releaseBlockers = [
    "Source chain needs human review: README describes direct sunnah.com links, and text/translation redistribution rights are not established by the Hugging Face MIT metadata alone.",
    "Grade source rights need human review: grades include named sources such as Darussalam or Al-Albani, but redistribution terms for those grade attributions are not documented in the dataset.",
    ...args.books.flatMap((book) => book.blockers.map((blocker) => `${book.book}: ${blocker}`))
  ];
  const warnings = args.books.flatMap((book) => book.warnings.map((warning) => `${book.book}: ${warning}`));

  return {
    generated_at: args.generatedAt,
    repository: "https://huggingface.co/datasets/meeAtif/hadith_datasets",
    ref: args.ref,
    commit: args.commit,
    license: {
      metadata_license: "MIT",
      note: "Hugging Face metadata declares MIT, but v1 bundling requires source-chain clearance for hadith text, translations, and grades."
    },
    books: args.books,
    summary: {
      books_expected: meeAtifSixBooks.length,
      books_found: args.books.length,
      total_rows: args.books.reduce((sum, book) => sum + book.row_count, 0),
      total_missing_arabic: args.books.reduce((sum, book) => sum + book.missing_arabic_count, 0),
      total_missing_english: args.books.reduce((sum, book) => sum + book.missing_english_count, 0),
      total_missing_grades: args.books.reduce((sum, book) => sum + book.missing_grade_count, 0),
      total_sunnah_references: args.books.reduce((sum, book) => sum + book.sunnah_reference_count, 0),
      grade_sources: [...gradeSources].sort(),
      total_release_blockers: releaseBlockers.length,
      total_warnings: warnings.length,
      can_bundle_v1_data: releaseBlockers.length === 0
    },
    release_blockers: releaseBlockers,
    warnings
  };
}

export function renderMeeAtifMarkdown(report: MeeAtifAuditReport): string {
  const lines = [
    "# meeAtif Hadith Dataset Audit Report",
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
    `- Books found: ${report.summary.books_found}`,
    `- Total rows inspected: ${report.summary.total_rows}`,
    `- Missing Arabic rows: ${report.summary.total_missing_arabic}`,
    `- Missing English rows: ${report.summary.total_missing_english}`,
    `- Missing grade rows: ${report.summary.total_missing_grades}`,
    `- Sunnah.com references: ${report.summary.total_sunnah_references}`,
    `- Grade sources: ${report.summary.grade_sources.join(", ") || "none"}`,
    `- Release blockers: ${report.summary.total_release_blockers}`,
    `- Warnings: ${report.summary.total_warnings}`,
    `- Can bundle v1 data: ${report.summary.can_bundle_v1_data ? "yes" : "no"}`,
    "",
    "## Book Coverage",
    "",
    "| Book | Rows | Missing Arabic | Missing English | Missing Grades | Grade sources |",
    "| --- | ---: | ---: | ---: | ---: | --- |",
    ...report.books.map(
      (book) =>
        `| ${book.display_name} | ${book.row_count} | ${book.missing_arabic_count} | ${book.missing_english_count} | ${book.missing_grade_count} | ${book.grade_sources.join(", ") || "none"} |`
    ),
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
    "- Empty grade fields are acceptable only if MCP responses return grade null with provenance notes.",
    "- Source links pointing to Sunnah.com do not by themselves establish redistribution rights."
  ];

  return `${lines.join("\n")}\n`;
}
