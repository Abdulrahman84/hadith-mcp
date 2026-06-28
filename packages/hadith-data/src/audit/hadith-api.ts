export type HadithApiBookKey = "bukhari" | "muslim" | "abudawud" | "tirmidhi" | "nasai" | "ibnmajah";

export type HadithApiEditionMetadata = {
  name: string;
  book: string;
  author: string;
  language: string;
  source: string;
  comments: string;
  link: string;
  linkmin: string;
};

export type HadithApiHadith = {
  hadithnumber?: number | string;
  arabicnumber?: number | string;
  text?: string;
  grades?: { name?: string; grade?: string }[];
  reference?: {
    book?: number | string;
    hadith?: number | string;
  };
};

export type HadithApiEditionFile = {
  metadata?: unknown;
  hadiths?: HadithApiHadith[];
};

export type EditionAudit = {
  name: string;
  language: string;
  author: string;
  source_present: boolean;
  comments: string;
  hadith_count: number;
  missing_text_count: number;
  duplicate_hadith_numbers: string[];
  hadiths_with_grades: number;
  unattributed_grade_count: number;
  grade_sources: string[];
};

export type BookAudit = {
  book: HadithApiBookKey;
  display_name: string;
  arabic: EditionAudit | null;
  english: EditionAudit | null;
  count_match: boolean;
  blockers: string[];
  warnings: string[];
};

export type HadithApiAuditReport = {
  generated_at: string;
  repository: string;
  ref: string;
  commit: string | null;
  license: {
    repository_license: string;
    license_url: string;
    note: string;
  };
  references_url: string;
  books: BookAudit[];
  summary: {
    books_expected: number;
    books_found: number;
    total_arabic_hadiths: number;
    total_english_hadiths: number;
    total_release_blockers: number;
    total_warnings: number;
    can_bundle_v1_data: boolean;
  };
  release_blockers: string[];
  warnings: string[];
};

export const sixBooks: { key: HadithApiBookKey; displayName: string; arabicEdition: string; englishEdition: string }[] = [
  { key: "bukhari", displayName: "Sahih al-Bukhari", arabicEdition: "ara-bukhari", englishEdition: "eng-bukhari" },
  { key: "muslim", displayName: "Sahih Muslim", arabicEdition: "ara-muslim", englishEdition: "eng-muslim" },
  { key: "abudawud", displayName: "Sunan Abi Dawud", arabicEdition: "ara-abudawud", englishEdition: "eng-abudawud" },
  { key: "tirmidhi", displayName: "Jami at-Tirmidhi", arabicEdition: "ara-tirmidhi", englishEdition: "eng-tirmidhi" },
  { key: "nasai", displayName: "Sunan an-Nasa'i", arabicEdition: "ara-nasai", englishEdition: "eng-nasai" },
  { key: "ibnmajah", displayName: "Sunan Ibn Majah", arabicEdition: "ara-ibnmajah", englishEdition: "eng-ibnmajah" }
];

export function auditEdition(metadata: HadithApiEditionMetadata, file: HadithApiEditionFile): EditionAudit {
  const hadiths = file.hadiths ?? [];
  const seenNumbers = new Set<string>();
  const duplicateNumbers = new Set<string>();
  const gradeSources = new Set<string>();
  let missingTextCount = 0;
  let hadithsWithGrades = 0;
  let unattributedGradeCount = 0;

  for (const hadith of hadiths) {
    const number = String(hadith.hadithnumber ?? "").trim();
    if (number.length > 0) {
      if (seenNumbers.has(number)) {
        duplicateNumbers.add(number);
      }
      seenNumbers.add(number);
    }

    if (typeof hadith.text !== "string" || hadith.text.trim().length === 0) {
      missingTextCount += 1;
    }

    const grades = hadith.grades ?? [];
    if (grades.length > 0) {
      hadithsWithGrades += 1;
    }

    for (const grade of grades) {
      const source = grade.name?.trim() ?? "";
      const value = grade.grade?.trim() ?? "";
      if (source.length === 0 || value.length === 0) {
        unattributedGradeCount += 1;
      } else {
        gradeSources.add(source);
      }
    }
  }

  return {
    name: metadata.name,
    language: metadata.language,
    author: metadata.author,
    source_present: metadata.source.trim().length > 0,
    comments: metadata.comments,
    hadith_count: hadiths.length,
    missing_text_count: missingTextCount,
    duplicate_hadith_numbers: [...duplicateNumbers].sort((a, b) => Number(a) - Number(b)),
    hadiths_with_grades: hadithsWithGrades,
    unattributed_grade_count: unattributedGradeCount,
    grade_sources: [...gradeSources].sort()
  };
}

export function auditBook(args: {
  book: HadithApiBookKey;
  displayName: string;
  arabic: EditionAudit | null;
  english: EditionAudit | null;
}): BookAudit {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (args.arabic === null) {
    blockers.push("Missing Arabic edition.");
  } else {
    if (!args.arabic.source_present) {
      blockers.push(`Arabic edition ${args.arabic.name} has no edition-level source field.`);
    }
    if (args.arabic.missing_text_count > 0) {
      blockers.push(`Arabic edition ${args.arabic.name} has ${args.arabic.missing_text_count} records with missing text.`);
    }
    if (args.arabic.duplicate_hadith_numbers.length > 0) {
      blockers.push(`Arabic edition ${args.arabic.name} has duplicate hadith numbers.`);
    }
    if (args.arabic.unattributed_grade_count > 0) {
      blockers.push(`Arabic edition ${args.arabic.name} has unattributed grade entries.`);
    }
  }

  if (args.english === null) {
    warnings.push("Missing English edition.");
  } else {
    if (!args.english.source_present) {
      blockers.push(`English edition ${args.english.name} has no edition-level source field.`);
    }
    if (args.english.missing_text_count > 0) {
      warnings.push(`English edition ${args.english.name} has ${args.english.missing_text_count} records with missing text.`);
    }
    if (args.english.duplicate_hadith_numbers.length > 0) {
      warnings.push(`English edition ${args.english.name} has duplicate hadith numbers.`);
    }
    if (args.english.unattributed_grade_count > 0) {
      blockers.push(`English edition ${args.english.name} has unattributed grade entries.`);
    }
  }

  const countMatch =
    args.arabic !== null && args.english !== null && args.arabic.hadith_count === args.english.hadith_count;
  if (args.arabic !== null && args.english !== null && !countMatch) {
    warnings.push(`Arabic and English edition counts differ: ${args.arabic.hadith_count} vs ${args.english.hadith_count}.`);
  }

  return {
    book: args.book,
    display_name: args.displayName,
    arabic: args.arabic,
    english: args.english,
    count_match: countMatch,
    blockers,
    warnings
  };
}

export function buildAuditReport(args: {
  generatedAt: string;
  ref: string;
  commit: string | null;
  books: BookAudit[];
}): HadithApiAuditReport {
  const releaseBlockers = [
    "Upstream References.md lists broad source references, but the inspected edition metadata does not provide record-level provenance.",
    ...args.books.flatMap((book) => book.blockers.map((blocker) => `${book.book}: ${blocker}`))
  ];
  const warnings = args.books.flatMap((book) => book.warnings.map((warning) => `${book.book}: ${warning}`));
  const totalArabic = args.books.reduce((sum, book) => sum + (book.arabic?.hadith_count ?? 0), 0);
  const totalEnglish = args.books.reduce((sum, book) => sum + (book.english?.hadith_count ?? 0), 0);
  const booksFound = args.books.filter((book) => book.arabic !== null).length;

  return {
    generated_at: args.generatedAt,
    repository: "https://github.com/fawazahmed0/hadith-api",
    ref: args.ref,
    commit: args.commit,
    license: {
      repository_license: "Unlicense",
      license_url: "https://github.com/fawazahmed0/hadith-api/blob/1/LICENSE",
      note: "Repository-level license is permissive, but v1 bundling still requires source/provenance review for the imported hadith texts and translations."
    },
    references_url: "https://github.com/fawazahmed0/hadith-api/blob/1/References.md",
    books: args.books,
    summary: {
      books_expected: sixBooks.length,
      books_found: booksFound,
      total_arabic_hadiths: totalArabic,
      total_english_hadiths: totalEnglish,
      total_release_blockers: releaseBlockers.length,
      total_warnings: warnings.length,
      can_bundle_v1_data: releaseBlockers.length === 0
    },
    release_blockers: releaseBlockers,
    warnings
  };
}

export function renderAuditMarkdown(report: HadithApiAuditReport): string {
  const lines = [
    "# Hadith API Audit Report",
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
    `- Books found with Arabic editions: ${report.summary.books_found}`,
    `- Total Arabic hadith records inspected: ${report.summary.total_arabic_hadiths}`,
    `- Total English hadith records inspected: ${report.summary.total_english_hadiths}`,
    `- Release blockers: ${report.summary.total_release_blockers}`,
    `- Warnings: ${report.summary.total_warnings}`,
    `- Can bundle v1 data: ${report.summary.can_bundle_v1_data ? "yes" : "no"}`,
    "",
    "## Book Coverage",
    "",
    "| Book | Arabic edition | Arabic count | English edition | English count | Counts match | Grade sources |",
    "| --- | --- | ---: | --- | ---: | --- | --- |",
    ...report.books.map((book) => {
      const gradeSources = new Set([...(book.arabic?.grade_sources ?? []), ...(book.english?.grade_sources ?? [])]);
      return [
        book.display_name,
        book.arabic?.name ?? "missing",
        String(book.arabic?.hadith_count ?? 0),
        book.english?.name ?? "missing",
        String(book.english?.hadith_count ?? 0),
        book.count_match ? "yes" : "no",
        [...gradeSources].join(", ") || "none"
      ].join(" | ");
    }).map((row) => `| ${row} |`),
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
    "- Repository-level licensing is not treated as sufficient record-level provenance.",
    "- Grades may be usable only when the grade source/name and grade value are present and provenance is accepted."
  ];

  return `${lines.join("\n")}\n`;
}
