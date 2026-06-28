import { describe, expect, it } from "vitest";
import { validateNormalizedRows, type NormalizedHadithRow } from "../src/index.js";

const baseRow: NormalizedHadithRow = {
  collection: "bukhari",
  hadith_number: "1",
  arabic_text: "fixture Arabic text",
  english_text: "fixture English text",
  grade: null,
  source_dataset: "fixture",
  source_url_or_reference: "fixture-reference"
};

describe("validateNormalizedRows", () => {
  it("reports collection counts for valid normalized rows", () => {
    const report = validateNormalizedRows([baseRow]);

    expect(report.total_rows).toBe(1);
    expect(report.collections).toEqual({ bukhari: 1 });
    expect(report.release_blockers).toEqual([]);
  });

  it("blocks rows that lack Arabic text or source provenance", () => {
    const report = validateNormalizedRows([
      {
        ...baseRow,
        arabic_text: "",
        source_dataset: ""
      }
    ]);

    expect(report.release_blockers.map((warning) => warning.code)).toEqual(["missing_arabic", "missing_source"]);
  });

  it("blocks unattributed grades", () => {
    const report = validateNormalizedRows([
      {
        ...baseRow,
        grade: {
          value: "fixture-grade",
          source: "",
          source_reference: ""
        }
      }
    ]);

    expect(report.release_blockers.map((warning) => warning.code)).toEqual(["unattributed_grade"]);
  });
});
