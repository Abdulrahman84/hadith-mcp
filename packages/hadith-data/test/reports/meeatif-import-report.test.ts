import { describe, expect, it } from "vitest";
import { createMeeAtifImportReport, renderMeeAtifImportReportMarkdown, type MeeAtifImportWarning } from "../../src/index.js";
import { normalizedFixtureRows } from "../../src/fixtures/normalized.js";

describe("meeAtif import report", () => {
  it("summarizes rows, text coverage, grades, and warnings", () => {
    const importWarnings: MeeAtifImportWarning[] = [
      {
        code: "missing_english",
        collection: "bukhari",
        source_reference: "fixture",
        message: "English text is missing."
      },
      {
        code: "unparseable_reference",
        collection: "muslim",
        source_reference: "bad",
        message: "Could not parse reference."
      }
    ];
    const report = createMeeAtifImportReport({
      rows: [
        {
          ...normalizedFixtureRows[0]!,
          english_text: null
        },
        normalizedFixtureRows[2]!
      ],
      importWarnings,
      sqliteWarnings: [],
      sqliteReleaseBlockers: [],
      datasetVersion: "fixture-version",
      datasetUrl: "https://example.test/dataset",
      licenseNote: "fixture license",
      generatedAt: new Date("2026-06-28T00:00:00.000Z")
    });

    expect(report.generated_at).toBe("2026-06-28T00:00:00.000Z");
    expect(report.rows.imported).toBe(2);
    expect(report.rows.skipped).toBe(1);
    expect(report.rows.by_collection).toEqual({ bukhari: 1, tirmidhi: 1 });
    expect(report.text_coverage).toMatchObject({
      arabic_rows: 2,
      english_rows: 1,
      missing_english_rows: 1,
      missing_english_by_collection: { bukhari: 1 }
    });
    expect(report.grade_coverage.graded_rows).toBe(1);
    expect(report.grade_coverage.ungraded_rows).toBe(1);
    expect(report.grade_coverage.grade_sources).toEqual({ "fixture grader": 1 });
    expect(report.import_warnings.by_code).toEqual({ missing_english: 1, unparseable_reference: 1 });
    expect(report.import_warnings.by_collection).toEqual({ bukhari: 1, muslim: 1 });

    const markdown = renderMeeAtifImportReportMarkdown(report);
    expect(markdown).toContain("# meeAtif Import Report");
    expect(markdown).toContain("Imported rows: 2");
    expect(markdown).toContain("Release blockers: 0");
  });
});
