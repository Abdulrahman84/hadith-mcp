export type MaktabaGradeSource = {
  book_id: string;
  collection: "abudawud" | "tirmidhi" | "nasai" | "ibnmajah";
  grader: string;
  source_url: string;
  file_count: number;
  index_file_present: boolean;
};

export type MaktabaGradesAuditReport = {
  generated_at: string;
  repository: string;
  ref: string;
  commit: string | null;
  license: {
    repository_license: string | null;
    note: string;
  };
  sources: MaktabaGradeSource[];
  summary: {
    sources_count: number;
    collections_covered: string[];
    graders: string[];
    total_grade_pages: number;
    total_release_blockers: number;
    total_warnings: number;
    can_bundle_v1_data: boolean;
  };
  release_blockers: string[];
  warnings: string[];
};

export const maktabaGradeSources: Omit<MaktabaGradeSource, "file_count" | "index_file_present">[] = [
  { book_id: "1755", collection: "abudawud", grader: "Al-Albani", source_url: "https://al-maktaba.org/book/1755" },
  { book_id: "32832", collection: "abudawud", grader: "Shuaib Al Arnaut", source_url: "https://al-maktaba.org/book/32832" },
  {
    book_id: "33759",
    collection: "abudawud",
    grader: "Muhammad Muhyi Al-Din Abdul Hamid",
    source_url: "https://al-maktaba.org/book/33759"
  },
  { book_id: "783", collection: "nasai", grader: "Al-Albani", source_url: "https://al-maktaba.org/book/783" },
  { book_id: "33865", collection: "nasai", grader: "Abu Ghuddah", source_url: "https://al-maktaba.org/book/33865" },
  { book_id: "782", collection: "tirmidhi", grader: "Al-Albani", source_url: "https://al-maktaba.org/book/782" },
  { book_id: "33754", collection: "tirmidhi", grader: "Ahmad Muhammad Shakir", source_url: "https://al-maktaba.org/book/33754" },
  { book_id: "33861", collection: "tirmidhi", grader: "Bashar Awad Maarouf", source_url: "https://al-maktaba.org/book/33861" },
  { book_id: "810", collection: "ibnmajah", grader: "Al-Albani", source_url: "https://al-maktaba.org/book/810" },
  { book_id: "1198", collection: "ibnmajah", grader: "Muhammad Fouad Abd al-Baqi", source_url: "https://al-maktaba.org/book/1198" },
  { book_id: "33036", collection: "ibnmajah", grader: "Shuaib Al Arnaut", source_url: "https://al-maktaba.org/book/33036" }
];

export function buildMaktabaGradesReport(args: {
  generatedAt: string;
  ref: string;
  commit: string | null;
  sources: MaktabaGradeSource[];
  licensePresent: boolean;
}): MaktabaGradesAuditReport {
  const graders = new Set(args.sources.map((source) => source.grader));
  const collections = new Set(args.sources.map((source) => source.collection));
  const releaseBlockers = [
    "Repository license was not found; bundled redistribution of copied Shamela/al-Maktaba pages is not cleared.",
    "Grade extraction is not implemented yet; HTML pages must be parsed and mapped to canonical hadith references before use.",
    "Coverage excludes Sahih al-Bukhari and Sahih Muslim grade sources.",
    ...args.sources
      .filter((source) => source.file_count === 0)
      .map((source) => `${source.book_id}: no per-page HTML files found.`)
  ];
  const warnings = args.sources
    .filter((source) => !source.index_file_present)
    .map((source) => `${source.book_id}: top-level index HTML was not found.`);

  return {
    generated_at: args.generatedAt,
    repository: "https://github.com/fawazahmed0/maktaba-grades-backup",
    ref: args.ref,
    commit: args.commit,
    license: {
      repository_license: args.licensePresent ? "present" : null,
      note: args.licensePresent
        ? "License file exists, but terms still require review against source content."
        : "No repository license file was found during audit."
    },
    sources: args.sources,
    summary: {
      sources_count: args.sources.length,
      collections_covered: [...collections].sort(),
      graders: [...graders].sort(),
      total_grade_pages: args.sources.reduce((sum, source) => sum + source.file_count, 0),
      total_release_blockers: releaseBlockers.length,
      total_warnings: warnings.length,
      can_bundle_v1_data: releaseBlockers.length === 0
    },
    release_blockers: releaseBlockers,
    warnings
  };
}

export function renderMaktabaGradesMarkdown(report: MaktabaGradesAuditReport): string {
  const lines = [
    "# Maktaba Grades Backup Audit Report",
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
    `- Grade source books: ${report.summary.sources_count}`,
    `- Collections covered: ${report.summary.collections_covered.join(", ")}`,
    `- Graders: ${report.summary.graders.join(", ")}`,
    `- Total per-page HTML files: ${report.summary.total_grade_pages}`,
    `- Release blockers: ${report.summary.total_release_blockers}`,
    `- Warnings: ${report.summary.total_warnings}`,
    `- Can bundle v1 data: ${report.summary.can_bundle_v1_data ? "yes" : "no"}`,
    "",
    "## Grade Sources",
    "",
    "| Book ID | Collection | Grader | Page files | Source URL |",
    "| --- | --- | --- | ---: | --- |",
    ...report.sources.map(
      (source) =>
        `| ${source.book_id} | ${source.collection} | ${source.grader} | ${source.file_count} | ${source.source_url} |`
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
    "- This report intentionally does not store hadith or grade page text.",
    "- This source is best treated as a grade provenance candidate until license and parser work are complete.",
    "- Bukhari and Muslim should continue returning grade null unless another audited grade source is added."
  ];

  return `${lines.join("\n")}\n`;
}
