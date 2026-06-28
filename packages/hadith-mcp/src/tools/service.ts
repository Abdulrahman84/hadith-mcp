import { canonicalizeCollection, normalizeHadithNumber } from "../collections.js";
import { fixtureCollections, fixtureProvenanceNotes, fixtureRecords } from "../fixtures/records.js";
import type { CollectionSummary, HadithRecord, Language, SearchResult, ToolError } from "../types.js";

const importVersion = "fixture-0";

export type HadithService = {
  listCollections(): { collections: CollectionSummary[] };
  fetchHadith(args: {
    collection: string;
    hadith_number: string | number;
    language?: Language;
  }): { result: HadithRecord | ToolError };
  searchHadith(args: {
    query: string;
    collection?: string | undefined;
    language?: Language | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
  }): {
    query: string;
    collection: string | null;
    language: Language;
    limit: number;
    offset: number;
    total: number;
    results: SearchResult[];
    provenance_notes: string[];
  };
  validateHadithReference(args: {
    collection: string;
    hadith_number: string | number;
  }): {
    valid: boolean;
    collection: string;
    canonical_collection: string | null;
    hadith_number: string;
    suggestions: { collection: string; hadith_number: string; reason: string }[];
    provenance_notes: string[];
  };
  getHadithMetadata(args: {
    collection: string;
    hadith_number: string | number;
  }): {
    result:
      | {
          collection: string;
          display_name: string;
          book: string | null;
          chapter: string | null;
          hadith_number: string;
          numbering: { scheme: string; value: string };
          source_dataset: string;
          import_version: string;
          provenance_notes: string[];
        }
      | ToolError;
  };
  getHadithGrade(args: {
    collection: string;
    hadith_number: string | number;
  }): {
    result:
      | {
          collection: string;
          hadith_number: string;
          grade: HadithRecord["grade"];
          provenance_notes: string[];
        }
      | ToolError;
  };
};

function findRecord(collection: string, hadithNumber: string | number): HadithRecord | null {
  const canonical = canonicalizeCollection(collection);
  const normalizedNumber = normalizeHadithNumber(hadithNumber);

  if (canonical === null) {
    return null;
  }

  return fixtureRecords.find((record) => record.collection === canonical && record.hadith_number === normalizedNumber) ?? null;
}

function missingRecordError(collection: string, hadithNumber: string | number): ToolError {
  return {
    error: {
      code: "hadith_not_found",
      message: `No fixture record found for ${collection} ${normalizeHadithNumber(hadithNumber)}.`,
      provenance_notes: [
        "The current implementation is fixture-backed only.",
        "Real Six Books lookup will be added after source audit and SQLite import work."
      ]
    }
  };
}

function shapeLanguage(record: HadithRecord, language: Language): HadithRecord {
  if (language === "arabic") {
    return { ...record, english_text: null };
  }

  if (language === "english") {
    return { ...record, arabic_text: "" };
  }

  return record;
}

function containsForLanguage(record: HadithRecord, query: string, language: Language): boolean {
  const normalizedQuery = query.toLowerCase();
  const haystacks = [
    language !== "english" ? record.arabic_text : "",
    language !== "arabic" ? record.english_text ?? "" : "",
    record.collection,
    record.display_name
  ];

  return haystacks.some((value) => value.toLowerCase().includes(normalizedQuery));
}

function snippetFor(record: HadithRecord, query: string, language: Language): string {
  const source =
    language === "arabic"
      ? record.arabic_text
      : language === "english"
        ? record.english_text ?? ""
        : record.english_text ?? record.arabic_text;

  if (source.length <= 120) {
    return source;
  }

  const index = source.toLowerCase().indexOf(query.toLowerCase());
  const start = Math.max(0, index - 40);
  return source.slice(start, start + 120);
}

export function createFixtureHadithService(): HadithService {
  return {
    listCollections() {
      return { collections: fixtureCollections() };
    },

    fetchHadith(args) {
      const record = findRecord(args.collection, args.hadith_number);

      if (record === null) {
        return { result: missingRecordError(args.collection, args.hadith_number) };
      }

      return { result: shapeLanguage(record, args.language ?? "both") };
    },

    searchHadith(args) {
      const language = args.language ?? "both";
      const limit = args.limit ?? 10;
      const offset = args.offset ?? 0;
      const canonicalCollection = args.collection === undefined ? null : canonicalizeCollection(args.collection);
      const scopedRecords =
        canonicalCollection === null && args.collection !== undefined
          ? []
          : fixtureRecords.filter((record) => canonicalCollection === null || record.collection === canonicalCollection);

      const matches = scopedRecords
        .filter((record) => containsForLanguage(record, args.query, language))
        .map<SearchResult>((record, index) => ({
          ...shapeLanguage(record, language),
          snippet: snippetFor(record, args.query, language),
          rank: index + 1
        }));

      return {
        query: args.query,
        collection: canonicalCollection,
        language,
        limit,
        offset,
        total: matches.length,
        results: matches.slice(offset, offset + limit),
        provenance_notes: fixtureProvenanceNotes
      };
    },

    validateHadithReference(args) {
      const canonical = canonicalizeCollection(args.collection);
      const hadithNumber = normalizeHadithNumber(args.hadith_number);
      const valid = canonical !== null && findRecord(args.collection, hadithNumber) !== null;
      const suggestions =
        canonical === null
          ? fixtureCollections().slice(0, 3).map((collection) => ({
              collection: collection.collection,
              hadith_number: "1",
              reason: "Known fixture collection."
            }))
          : fixtureRecords
              .filter((record) => record.collection === canonical)
              .slice(0, 3)
              .map((record) => ({
                collection: record.collection,
                hadith_number: record.hadith_number,
                reason: "Available fixture reference in this collection."
              }));

      return {
        valid,
        collection: args.collection,
        canonical_collection: canonical,
        hadith_number: hadithNumber,
        suggestions: valid ? [] : suggestions,
        provenance_notes: fixtureProvenanceNotes
      };
    },

    getHadithMetadata(args) {
      const record = findRecord(args.collection, args.hadith_number);

      if (record === null) {
        return { result: missingRecordError(args.collection, args.hadith_number) };
      }

      return {
        result: {
          collection: record.collection,
          display_name: record.display_name,
          book: record.book,
          chapter: record.chapter,
          hadith_number: record.hadith_number,
          numbering: {
            scheme: "fixture collection-local number",
            value: record.hadith_number
          },
          source_dataset: record.source_dataset,
          import_version: importVersion,
          provenance_notes: record.provenance_notes
        }
      };
    },

    getHadithGrade(args) {
      const record = findRecord(args.collection, args.hadith_number);

      if (record === null) {
        return { result: missingRecordError(args.collection, args.hadith_number) };
      }

      return {
        result: {
          collection: record.collection,
          hadith_number: record.hadith_number,
          grade: record.grade,
          provenance_notes:
            record.grade === null
              ? ["No source-attributed grade is available for this fixture record.", ...record.provenance_notes]
              : record.grade.provenance_notes
        }
      };
    }
  };
}

const defaultService = createFixtureHadithService();

export const listCollections = defaultService.listCollections;
export const fetchHadith = defaultService.fetchHadith;
export const searchHadith = defaultService.searchHadith;
export const validateHadithReference = defaultService.validateHadithReference;
export const getHadithMetadata = defaultService.getHadithMetadata;
export const getHadithGrade = defaultService.getHadithGrade;
