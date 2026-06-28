import { describe, expect, it } from "vitest";
import { auditBook, auditEdition, buildAuditReport, renderAuditMarkdown } from "../../src/audit/hadith-api.js";

const metadata = {
  name: "ara-example",
  book: "example",
  author: "Unknown",
  language: "Arabic",
  source: "",
  comments: "",
  link: "",
  linkmin: ""
};

describe("hadith-api audit helpers", () => {
  it("detects missing text, duplicate references, and unattributed grades", () => {
    const audit = auditEdition(metadata, {
      hadiths: [
        { hadithnumber: 1, text: "text", grades: [{ name: "A", grade: "Sahih" }] },
        { hadithnumber: 1, text: "", grades: [{ name: "", grade: "Hasan" }] }
      ]
    });

    expect(audit.source_present).toBe(false);
    expect(audit.missing_text_count).toBe(1);
    expect(audit.duplicate_hadith_numbers).toEqual(["1"]);
    expect(audit.hadiths_with_grades).toBe(2);
    expect(audit.unattributed_grade_count).toBe(1);
    expect(audit.grade_sources).toEqual(["A"]);
  });

  it("builds release blockers when edition sources are missing", () => {
    const arabic = auditEdition(metadata, { hadiths: [{ hadithnumber: 1, text: "text", grades: [] }] });
    const english = auditEdition({ ...metadata, name: "eng-example", language: "English" }, {
      hadiths: [{ hadithnumber: 1, text: "translation", grades: [] }]
    });
    const book = auditBook({ book: "bukhari", displayName: "Example", arabic, english });
    const report = buildAuditReport({
      generatedAt: "2026-06-28T00:00:00.000Z",
      ref: "1",
      commit: "abc",
      books: [book]
    });

    expect(report.summary.can_bundle_v1_data).toBe(false);
    expect(report.release_blockers.join(" ")).toContain("no edition-level source field");
    expect(renderAuditMarkdown(report)).toContain("Can bundle v1 data: no");
  });
});
