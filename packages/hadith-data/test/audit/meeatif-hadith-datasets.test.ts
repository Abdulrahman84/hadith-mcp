import { describe, expect, it } from "vitest";
import { auditMeeAtifBook, buildMeeAtifReport, renderMeeAtifMarkdown } from "../../src/audit/meeatif-hadith-datasets.js";

describe("meeAtif hadith dataset audit helpers", () => {
  it("counts missing fields and extracts grade sources", () => {
    const book = auditMeeAtifBook({
      book: "tirmidhi",
      displayName: "Example",
      file: "example.json",
      rows: [
        { Arabic_Text: "arabic", English_Text: "english", Grade: "Sahih (Darussalam)", Reference: "https://sunnah.com/example:1" },
        { Arabic_Text: "", English_Text: "", Grade: "", Reference: "" }
      ]
    });

    expect(book.row_count).toBe(2);
    expect(book.missing_arabic_count).toBe(1);
    expect(book.missing_english_count).toBe(1);
    expect(book.missing_grade_count).toBe(1);
    expect(book.missing_reference_count).toBe(1);
    expect(book.grade_sources).toEqual(["Darussalam"]);
  });

  it("blocks bundling until source chain and grade rights are cleared", () => {
    const book = auditMeeAtifBook({
      book: "tirmidhi",
      displayName: "Example",
      file: "example.json",
      rows: [
        { Arabic_Text: "arabic", English_Text: "english", Grade: "Sahih (Darussalam)", Reference: "https://sunnah.com/example:1" }
      ]
    });
    const report = buildMeeAtifReport({ generatedAt: "now", ref: "main", commit: "abc", books: [book] });

    expect(report.summary.can_bundle_v1_data).toBe(false);
    expect(report.release_blockers.join(" ")).toContain("Source chain needs human review");
    expect(renderMeeAtifMarkdown(report)).toContain("Darussalam");
  });
});
