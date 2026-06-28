import { describe, expect, it } from "vitest";
import { normalizeMeeAtifBooks } from "../../src/importers/meeatif.js";

describe("normalizeMeeAtifBooks", () => {
  it("normalizes Arabic, English, reference, and grade fields", () => {
    const result = normalizeMeeAtifBooks({
      datasetVersion: "test",
      datasetUrl: "https://example.test",
      licenseNote: "fixture license",
      books: [
        {
          key: "tirmidhi",
          displayName: "Jami at-Tirmidhi",
          file: "fixture.json",
          rows: [
            {
              Book: "Jami at-Tirmidhi",
              Chapter_Number: 1,
              Chapter_Title_English: "Fixture Chapter",
              Arabic_Text: "arabic",
              English_Text: "english",
              Grade: "Sahih (Darussalam)",
              Reference: "https://sunnah.com/tirmidhi:1",
              "In-book reference": "Book 1, Hadith 1"
            }
          ]
        }
      ]
    });

    expect(result.warnings).toEqual([]);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      collection: "tirmidhi",
      hadith_number: "1:1",
      book_number: "1",
      chapter_number: "1",
      arabic_text: "arabic",
      english_text: "english",
      grade: {
        value: "Sahih",
        source: "Darussalam"
      }
    });
  });

  it("keeps Muslim compound source references while preferring in-book import ids", () => {
    const result = normalizeMeeAtifBooks({
      datasetVersion: "test",
      datasetUrl: "https://example.test",
      licenseNote: "fixture license",
      books: [
        {
          key: "muslim",
          displayName: "Sahih Muslim",
          file: "fixture.json",
          rows: [
            {
              Arabic_Text: "arabic",
              English_Text: "",
              Grade: "",
              Reference: "https://sunnah.com/muslim:1697/1698a",
              "In-book reference": "Book 1, Hadith 1"
            }
          ]
        }
      ]
    });

    expect(result.rows[0]?.hadith_number).toBe("1:1");
    expect(result.rows[0]?.source_url_or_reference).toBe("https://sunnah.com/muslim:1697/1698a");
    expect(result.rows[0]?.english_text).toBeNull();
    expect(result.rows[0]?.grade).toBeNull();
    expect(result.warnings.map((warning) => warning.code)).toEqual(["missing_english", "missing_grade"]);
  });

  it("skips unparseable references with a warning", () => {
    const result = normalizeMeeAtifBooks({
      datasetVersion: "test",
      datasetUrl: "https://example.test",
      licenseNote: "fixture license",
      books: [
        {
          key: "bukhari",
          displayName: "Sahih al-Bukhari",
          file: "fixture.json",
          rows: [
            {
              Arabic_Text: "arabic",
              English_Text: "english",
              Grade: "",
              Reference: "not-a-sunnah-url"
            }
          ]
        }
      ]
    });

    expect(result.rows).toEqual([]);
    expect(result.warnings.map((warning) => warning.code)).toEqual(["unparseable_reference"]);
  });
});
