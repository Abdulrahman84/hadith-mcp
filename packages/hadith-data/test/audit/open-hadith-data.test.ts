import { describe, expect, it } from "vitest";
import {
  auditCsvRecords,
  auditOpenHadithBook,
  buildOpenHadithDataReport,
  renderOpenHadithDataMarkdown
} from "../../src/audit/open-hadith-data.js";

describe("Open-Hadith-Data audit helpers", () => {
  it("detects missing text and duplicate numbers in CSV records", () => {
    const audit = auditCsvRecords({
      path: "Example/example.csv",
      url: "https://example.test/example.csv",
      sizeBytes: 123,
      sha: "abc",
      records: [
        ["1", "arabic text"],
        ["1", ""],
        ["", "arabic text", "elaboration"]
      ]
    });

    expect(audit.row_count).toBe(3);
    expect(audit.min_columns).toBe(2);
    expect(audit.max_columns).toBe(3);
    expect(audit.missing_number_count).toBe(1);
    expect(audit.missing_arabic_text_count).toBe(1);
    expect(audit.duplicate_numbers).toEqual(["1"]);
    expect(audit.has_elaboration_column).toBe(true);
  });

  it("builds a report with source-chain blocker and Arabic-only warnings", () => {
    const plain = auditCsvRecords({
      path: "plain.csv",
      url: "https://example.test/plain.csv",
      sizeBytes: 1,
      sha: "plain",
      records: [["1", "plain text"]]
    });
    const diacritized = auditCsvRecords({
      path: "diacritized.csv",
      url: "https://example.test/diacritized.csv",
      sizeBytes: 1,
      sha: "diacritized",
      records: [["1", "diacritized text", "elaboration"]]
    });
    const book = auditOpenHadithBook({
      book: "bukhari",
      displayName: "Example",
      folder: "Example",
      plain,
      diacritized
    });
    const report = buildOpenHadithDataReport({
      generatedAt: "2026-06-28T00:00:00.000Z",
      ref: "master",
      commit: "abc",
      upstreamCommit: "def",
      books: [book]
    });

    expect(report.summary.can_bundle_v1_data).toBe(false);
    expect(report.release_blockers.join(" ")).toContain("Source chain needs human review");
    expect(report.summary.total_release_blockers).toBe(1);
    expect(report.warnings.join(" ")).toContain("Arabic-only");
    expect(report.summary.has_english).toBe(false);
    expect(renderOpenHadithDataMarkdown(report)).toContain("Can bundle v1 data: no");
  });
});
