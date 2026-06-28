import type { NormalizedHadithSqliteRow } from "../sqlite/builder.js";

const base = {
  source_dataset: "fixture-only/non-release",
  source_dataset_version: "0",
  source_dataset_url: "local fixture",
  source_license_note: "Synthetic test fixture. Not real hadith data.",
  source_url_or_reference: "local synthetic fixture",
  provenance_note: "Synthetic fixture used only for SQLite builder and MCP integration tests."
};

export const normalizedFixtureRows: NormalizedHadithSqliteRow[] = [
  {
    ...base,
    collection: "bukhari",
    display_name: "Sahih al-Bukhari",
    hadith_number: "1",
    book_number: "1",
    book: "Fixture Book",
    chapter_number: "1",
    chapter: "Fixture Chapter",
    arabic_text: "[نص عربي تجريبي فقط - ليس حديثا حقيقيا]",
    english_text: "[fixture English text only - not a real hadith]",
    grade: null
  },
  {
    ...base,
    collection: "muslim",
    display_name: "Sahih Muslim",
    hadith_number: "1",
    book_number: "1",
    book: "Fixture Book",
    chapter_number: "1",
    chapter: "Fixture Chapter",
    arabic_text: "[نص عربي تجريبي لمسلم فقط - ليس حديثا حقيقيا]",
    english_text: "[fixture Muslim text only - not a real hadith]",
    grade: null
  },
  {
    ...base,
    collection: "tirmidhi",
    display_name: "Jami at-Tirmidhi",
    hadith_number: "1",
    book_number: "1",
    book: "Fixture Book",
    chapter_number: "1",
    chapter: "Fixture Chapter",
    arabic_text: "[نص عربي تجريبي للترمذي فقط - ليس حديثا حقيقيا]",
    english_text: "[fixture Tirmidhi text only - not a real hadith]",
    grade: {
      value: "fixture-grade",
      source: "fixture grader",
      source_reference: "local synthetic fixture"
    }
  }
];
