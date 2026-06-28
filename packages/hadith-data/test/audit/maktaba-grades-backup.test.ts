import { describe, expect, it } from "vitest";
import {
  buildMaktabaGradesReport,
  maktabaGradeSources,
  renderMaktabaGradesMarkdown
} from "../../src/audit/maktaba-grades-backup.js";

describe("maktaba grades backup audit helpers", () => {
  it("summarizes grade sources and blocks bundling without license/parser clearance", () => {
    const sources = maktabaGradeSources.slice(0, 2).map((source, index) => ({
      ...source,
      file_count: index + 1,
      index_file_present: true
    }));
    const report = buildMaktabaGradesReport({
      generatedAt: "now",
      ref: "main",
      commit: "abc",
      sources,
      licensePresent: false
    });

    expect(report.summary.sources_count).toBe(2);
    expect(report.summary.total_grade_pages).toBe(3);
    expect(report.summary.can_bundle_v1_data).toBe(false);
    expect(report.release_blockers.join(" ")).toContain("Repository license was not found");
    expect(renderMaktabaGradesMarkdown(report)).toContain("Al-Albani");
  });
});
