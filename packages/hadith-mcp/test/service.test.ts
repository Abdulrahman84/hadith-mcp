import { describe, expect, it } from "vitest";
import {
  fetchHadith,
  getHadithGrade,
  listCollections,
  searchHadith,
  validateHadithReference
} from "../src/index.js";
import {
  fetchHadithOutputSchema,
  gradeOutputSchema,
  listCollectionsOutputSchema,
  searchHadithOutputSchema,
  validateReferenceOutputSchema
} from "../src/schemas.js";

describe("fixture-backed hadith tools", () => {
  it("lists the Six Books fixture collections", () => {
    const output = listCollections();

    expect(() => listCollectionsOutputSchema.parse(output)).not.toThrow();
    expect(output.collections.map((collection) => collection.collection)).toEqual([
      "bukhari",
      "muslim",
      "abu_dawud",
      "tirmidhi",
      "nasai",
      "ibn_majah"
    ]);
  });

  it("fetches a hadith by alias and number with provenance", () => {
    const output = fetchHadith({
      collection: "sahih-bukhari",
      hadith_number: 1,
      language: "both"
    });

    expect(() => fetchHadithOutputSchema.parse(output)).not.toThrow();
    expect("error" in output.result).toBe(false);

    if ("error" in output.result) {
      throw new Error("expected fixture record");
    }

    expect(output.result.collection).toBe("bukhari");
    expect(output.result.source_dataset).toBe("fixture-only/non-release");
    expect(output.result.provenance_notes.join(" ")).toContain("Not real hadith text");
  });

  it("returns grade null when source-attributed grade is unavailable", () => {
    const output = getHadithGrade({
      collection: "bukhari",
      hadith_number: "1"
    });

    expect(() => gradeOutputSchema.parse(output)).not.toThrow();

    if ("error" in output.result) {
      throw new Error("expected fixture grade result");
    }

    expect(output.result.grade).toBeNull();
    expect(output.result.provenance_notes.join(" ")).toContain("No source-attributed grade");
  });

  it("returns source-attributed grade when the fixture has one", () => {
    const output = getHadithGrade({
      collection: "tirmidhi",
      hadith_number: "1"
    });

    expect(() => gradeOutputSchema.parse(output)).not.toThrow();

    if ("error" in output.result) {
      throw new Error("expected fixture grade result");
    }

    expect(output.result.grade?.source).toBe("fixture grader");
  });

  it("searches snippets without generated explanations", () => {
    const output = searchHadith({
      query: "fixture",
      language: "english",
      limit: 2,
      offset: 0
    });

    expect(() => searchHadithOutputSchema.parse(output)).not.toThrow();
    expect(output.total).toBeGreaterThan(0);
    expect(output.results).toHaveLength(2);
    expect(output.results[0]?.snippet).toContain("fixture");
  });

  it("validates known and unknown references with suggestions", () => {
    const valid = validateHadithReference({ collection: "ibn-majah", hadith_number: "1" });
    const invalid = validateHadithReference({ collection: "unknown", hadith_number: "9" });

    expect(() => validateReferenceOutputSchema.parse(valid)).not.toThrow();
    expect(() => validateReferenceOutputSchema.parse(invalid)).not.toThrow();
    expect(valid.valid).toBe(true);
    expect(invalid.valid).toBe(false);
    expect(invalid.suggestions.length).toBeGreaterThan(0);
  });
});
