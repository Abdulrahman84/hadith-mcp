import type { CollectionSummary, HadithRecord } from "../types.js";

export const fixtureProvenanceNotes = [
  "Fixture-only synthetic record for schema and MCP wiring tests.",
  "Not real hadith text and not suitable for religious use.",
  "Replace with audited source data before any v1 release."
];

const sourceDataset = "fixture-only/non-release";
const sourceReference = "local synthetic fixture";

export const fixtureRecords: HadithRecord[] = [
  {
    collection: "bukhari",
    display_name: "Sahih al-Bukhari",
    book: "Fixture Book",
    chapter: "Fixture Chapter",
    hadith_number: "1",
    arabic_text: "[نص عربي تجريبي فقط - ليس حديثا حقيقيا]",
    english_text: "[fixture English text only - not a real hadith]",
    grade: null,
    source_dataset: sourceDataset,
    source_url_or_reference: sourceReference,
    provenance_notes: fixtureProvenanceNotes
  },
  {
    collection: "muslim",
    display_name: "Sahih Muslim",
    book: "Fixture Book",
    chapter: "Fixture Chapter",
    hadith_number: "1",
    arabic_text: "[نص عربي تجريبي لمسلم فقط - ليس حديثا حقيقيا]",
    english_text: "[fixture Muslim text only - not a real hadith]",
    grade: null,
    source_dataset: sourceDataset,
    source_url_or_reference: sourceReference,
    provenance_notes: fixtureProvenanceNotes
  },
  {
    collection: "abu_dawud",
    display_name: "Sunan Abi Dawud",
    book: "Fixture Book",
    chapter: "Fixture Chapter",
    hadith_number: "1",
    arabic_text: "[نص عربي تجريبي لأبي داود فقط - ليس حديثا حقيقيا]",
    english_text: "[fixture Abu Dawud text only - not a real hadith]",
    grade: null,
    source_dataset: sourceDataset,
    source_url_or_reference: sourceReference,
    provenance_notes: fixtureProvenanceNotes
  },
  {
    collection: "tirmidhi",
    display_name: "Jami at-Tirmidhi",
    book: "Fixture Book",
    chapter: "Fixture Chapter",
    hadith_number: "1",
    arabic_text: "[نص عربي تجريبي للترمذي فقط - ليس حديثا حقيقيا]",
    english_text: "[fixture Tirmidhi text only - not a real hadith]",
    grade: {
      value: "fixture-grade",
      source: "fixture grader",
      source_reference: sourceReference,
      provenance_notes: [
        "Synthetic grade used only to test source-attributed grade plumbing.",
        "Do not treat this as a real hadith grade."
      ]
    },
    source_dataset: sourceDataset,
    source_url_or_reference: sourceReference,
    provenance_notes: fixtureProvenanceNotes
  },
  {
    collection: "nasai",
    display_name: "Sunan an-Nasa'i",
    book: "Fixture Book",
    chapter: "Fixture Chapter",
    hadith_number: "1",
    arabic_text: "[نص عربي تجريبي للنسائي فقط - ليس حديثا حقيقيا]",
    english_text: "[fixture Nasa'i text only - not a real hadith]",
    grade: null,
    source_dataset: sourceDataset,
    source_url_or_reference: sourceReference,
    provenance_notes: fixtureProvenanceNotes
  },
  {
    collection: "ibn_majah",
    display_name: "Sunan Ibn Majah",
    book: "Fixture Book",
    chapter: "Fixture Chapter",
    hadith_number: "1",
    arabic_text: "[نص عربي تجريبي لابن ماجه فقط - ليس حديثا حقيقيا]",
    english_text: "[fixture Ibn Majah text only - not a real hadith]",
    grade: null,
    source_dataset: sourceDataset,
    source_url_or_reference: sourceReference,
    provenance_notes: fixtureProvenanceNotes
  }
];

export function fixtureCollections(): CollectionSummary[] {
  return fixtureRecords.map((record) => ({
    collection: record.collection,
    display_name: record.display_name,
    language_coverage: record.english_text === null ? ["arabic"] : ["arabic", "english"],
    hadith_count: fixtureRecords.filter((item) => item.collection === record.collection).length,
    source_dataset: record.source_dataset
  }));
}
