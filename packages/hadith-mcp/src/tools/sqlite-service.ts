import {
  canonicalizeCollection,
  collectionForSunnahSlug,
  normalizeHadithNumber,
  sunnahSlugForCollection
} from "../collections.js";
import { SqliteJsonClient, sqlString } from "../db/sqlite.js";
import type { CollectionSummary, Grade, HadithRecord, Language, SearchResult, ToolError } from "../types.js";
import type { HadithService } from "./service.js";

type CollectionRow = {
  collection: string;
  display_name: string;
  language_coverage: string | null;
  hadith_count: number;
  source_dataset: string;
};

type HadithRow = {
  collection: string;
  display_name: string;
  book: string | null;
  chapter: string | null;
  hadith_number: string;
  arabic_text: string | null;
  english_text: string | null;
  grade_value: string | null;
  grader: string | null;
  grade_source_reference: string | null;
  grade_provenance_note: string | null;
  source_dataset: string;
  source_dataset_version: string;
  source_license_note: string;
  source_url_or_reference: string;
};

type SearchRow = HadithRow & {
  snippet: string;
};

type CountRow = {
  total: number;
};

type SuggestionRow = {
  hadith_number: string;
  source_url_or_reference: string;
};

type ResolvedReference = {
  collection: string | null;
  input_hadith_number: string;
  hadith_number_candidates: string[];
  source_reference_candidates: string[];
};

function missingRecordError(dbPath: string, collection: string, hadithNumber: string | number): ToolError {
  return {
    error: {
      code: "hadith_not_found",
      message: `No hadith record found for ${collection} ${normalizeHadithNumber(hadithNumber)}.`,
      provenance_notes: [`SQLite database: ${dbPath}.`, "No matching cited record was found."]
    }
  };
}

function sourceProvenance(row: HadithRow): string[] {
  return [
    `Source dataset: ${row.source_dataset} (${row.source_dataset_version}).`,
    `Source reference: ${row.source_url_or_reference}.`,
    `Dataset license note: ${row.source_license_note}.`
  ];
}

function gradeFromRow(row: HadithRow): Grade | null {
  if (row.grade_value === null || row.grader === null || row.grade_source_reference === null) {
    return null;
  }

  return {
    value: row.grade_value,
    source: row.grader,
    source_reference: row.grade_source_reference,
    provenance_notes: row.grade_provenance_note === null ? [] : [row.grade_provenance_note]
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

function recordFromRow(row: HadithRow, language: Language): HadithRecord {
  return shapeLanguage(
    {
      collection: row.collection,
      display_name: row.display_name,
      book: row.book,
      chapter: row.chapter,
      hadith_number: row.hadith_number,
      arabic_text: row.arabic_text ?? "",
      english_text: row.english_text,
      grade: gradeFromRow(row),
      source_dataset: row.source_dataset,
      source_url_or_reference: row.source_url_or_reference,
      provenance_notes: sourceProvenance(row)
    },
    language
  );
}

function baseHadithSelect(): string {
  return `
SELECT
  collections.collection,
  collections.display_name,
  books.title AS book,
  chapters.title AS chapter,
  hadiths.hadith_number,
  (SELECT text FROM hadith_texts WHERE hadith_id = hadiths.id AND language = 'arabic') AS arabic_text,
  (SELECT text FROM hadith_texts WHERE hadith_id = hadiths.id AND language = 'english') AS english_text,
  hadith_grades.grade_value,
  hadith_grades.grader,
  hadith_grades.source_reference AS grade_source_reference,
  hadith_grades.provenance_note AS grade_provenance_note,
  source_datasets.name AS source_dataset,
  source_datasets.version AS source_dataset_version,
  source_datasets.license_note AS source_license_note,
  hadiths.source_url_or_reference
FROM hadiths
JOIN collections ON collections.id = hadiths.collection_id
JOIN source_datasets ON source_datasets.id = collections.source_dataset_id
LEFT JOIN books ON books.id = hadiths.book_id
LEFT JOIN chapters ON chapters.id = hadiths.chapter_id
LEFT JOIN hadith_grades ON hadith_grades.hadith_id = hadiths.id
`;
}

function ftsQuery(query: string): string {
  return query
    .trim()
    .split(/\s+/)
    .filter((term) => term.length > 0)
    .map((term) => `"${term.replaceAll('"', '""')}"`)
    .join(" AND ");
}

function orderByHadithNumber(): string {
  return "ORDER BY CAST(hadiths.hadith_number AS INTEGER), hadiths.hadith_number";
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function parseSunnahReference(value: string): { collection: string; source_reference: string } | null {
  const trimmed = value.trim();
  const urlLike = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(urlLike);
    if (url.hostname.toLowerCase() !== "sunnah.com") {
      return null;
    }

    const reference = url.pathname.replace(/^\/+|\/+$/g, "");
    const [slug] = reference.split(":");
    if (slug === undefined) {
      return null;
    }

    const collection = collectionForSunnahSlug(slug);
    if (collection === null) {
      return null;
    }

    return {
      collection,
      source_reference: `https://sunnah.com/${reference}`
    };
  } catch {
    return null;
  }
}

function parseCollectionPrefixedReference(value: string): { collection: string; reference: string } | null {
  const match = /^([^:]+):(.+)$/.exec(value.trim());
  if (match === null) {
    return null;
  }

  const collection = canonicalizeCollection(match[1]!);
  if (collection === null) {
    return null;
  }

  return {
    collection,
    reference: match[2]!.trim()
  };
}

function resolveReference(collection: string, hadithNumber: string | number): ResolvedReference {
  const inputCollection = canonicalizeCollection(collection);
  const inputHadithNumber = normalizeHadithNumber(hadithNumber);
  const sunnahReference = parseSunnahReference(inputHadithNumber);
  const prefixedReference = parseCollectionPrefixedReference(inputHadithNumber);
  const resolvedCollection = inputCollection ?? sunnahReference?.collection ?? prefixedReference?.collection ?? null;
  const hadithNumberCandidates = [inputHadithNumber];
  const sourceReferenceCandidates = [inputHadithNumber];

  if (sunnahReference !== null) {
    sourceReferenceCandidates.push(sunnahReference.source_reference);
  }

  if (prefixedReference !== null) {
    hadithNumberCandidates.push(prefixedReference.reference);

    const slug = sunnahSlugForCollection(prefixedReference.collection);
    if (slug !== null) {
      sourceReferenceCandidates.push(`https://sunnah.com/${slug}:${prefixedReference.reference}`);
    }
  }

  if (resolvedCollection !== null) {
    const slug = sunnahSlugForCollection(resolvedCollection);
    if (slug !== null && !inputHadithNumber.includes("://")) {
      sourceReferenceCandidates.push(`https://sunnah.com/${slug}:${inputHadithNumber}`);
    }
  }

  return {
    collection: resolvedCollection,
    input_hadith_number: inputHadithNumber,
    hadith_number_candidates: unique(hadithNumberCandidates),
    source_reference_candidates: unique(sourceReferenceCandidates)
  };
}

function sqlInList(values: string[]): string {
  return values.map((value) => sqlString(value)).join(", ");
}

export function createSqliteHadithService(dbPath: string): HadithService {
  const db = new SqliteJsonClient(dbPath);

  function fetchRow(collection: string, hadithNumber: string | number): HadithRow | null {
    const reference = resolveReference(collection, hadithNumber);
    if (reference.collection === null) {
      return null;
    }

    const rows = db.query<HadithRow>(`
${baseHadithSelect()}
WHERE collections.collection = ${sqlString(reference.collection)}
  AND (
    hadiths.hadith_number IN (${sqlInList(reference.hadith_number_candidates)})
    OR hadiths.source_url_or_reference IN (${sqlInList(reference.source_reference_candidates)})
  )
ORDER BY
  CASE
    WHEN hadiths.hadith_number = ${sqlString(reference.input_hadith_number)} THEN 0
    WHEN hadiths.hadith_number IN (${sqlInList(reference.hadith_number_candidates)}) THEN 1
    WHEN hadiths.source_url_or_reference IN (${sqlInList(reference.source_reference_candidates)}) THEN 2
    ELSE 3
  END
LIMIT 1;
`);

    return rows[0] ?? null;
  }

  return {
    listCollections() {
      const rows = db.query<CollectionRow>(`
SELECT
  collections.collection,
  collections.display_name,
  group_concat(DISTINCT hadith_texts.language) AS language_coverage,
  COUNT(DISTINCT hadiths.id) AS hadith_count,
  source_datasets.name AS source_dataset
FROM collections
JOIN source_datasets ON source_datasets.id = collections.source_dataset_id
LEFT JOIN hadiths ON hadiths.collection_id = collections.id
LEFT JOIN hadith_texts ON hadith_texts.hadith_id = hadiths.id
GROUP BY collections.id
ORDER BY collections.collection;
`);

      return {
        collections: rows.map((row) => ({
          collection: row.collection,
          display_name: row.display_name,
          language_coverage: (row.language_coverage ?? "").split(",").filter(Boolean).sort(),
          hadith_count: row.hadith_count,
          source_dataset: row.source_dataset
        }))
      };
    },

    fetchHadith(args) {
      const row = fetchRow(args.collection, args.hadith_number);

      if (row === null) {
        return { result: missingRecordError(db.dbPath, args.collection, args.hadith_number) };
      }

      return { result: recordFromRow(row, args.language ?? "both") };
    },

    searchHadith(args) {
      const language = args.language ?? "both";
      const limit = args.limit ?? 10;
      const offset = args.offset ?? 0;
      const canonicalCollection = args.collection === undefined ? null : canonicalizeCollection(args.collection);
      const normalizedFtsQuery = ftsQuery(args.query);
      const filters = [`hadith_texts_fts MATCH ${sqlString(normalizedFtsQuery)}`];

      if (normalizedFtsQuery.length === 0) {
        return {
          query: args.query,
          collection: canonicalCollection,
          language,
          limit,
          offset,
          total: 0,
          results: [],
          provenance_notes: [`SQLite database: ${db.dbPath}.`, "Empty search query."]
        };
      }

      if (args.collection !== undefined && canonicalCollection === null) {
        return {
          query: args.query,
          collection: null,
          language,
          limit,
          offset,
          total: 0,
          results: [],
          provenance_notes: [`SQLite database: ${db.dbPath}.`, "Unknown collection filter."]
        };
      }

      if (canonicalCollection !== null) {
        filters.push(`hadith_texts_fts.collection = ${sqlString(canonicalCollection)}`);
      }

      if (language !== "both") {
        filters.push(`hadith_texts_fts.language = ${sqlString(language)}`);
      }

      const whereSql = filters.join(" AND ");
      const countRows = db.query<CountRow>(`
SELECT COUNT(*) AS total
FROM hadith_texts_fts
WHERE ${whereSql};
`);
      const rows = db.query<SearchRow>(`
SELECT
  collections.collection,
  collections.display_name,
  books.title AS book,
  chapters.title AS chapter,
  hadiths.hadith_number,
  (SELECT text FROM hadith_texts WHERE hadith_id = hadiths.id AND language = 'arabic') AS arabic_text,
  (SELECT text FROM hadith_texts WHERE hadith_id = hadiths.id AND language = 'english') AS english_text,
  hadith_grades.grade_value,
  hadith_grades.grader,
  hadith_grades.source_reference AS grade_source_reference,
  hadith_grades.provenance_note AS grade_provenance_note,
  source_datasets.name AS source_dataset,
  source_datasets.version AS source_dataset_version,
  source_datasets.license_note AS source_license_note,
  hadiths.source_url_or_reference,
  snippet(hadith_texts_fts, 4, '[', ']', '...', 16) AS snippet
FROM hadith_texts_fts
JOIN hadith_texts ON hadith_texts.id = hadith_texts_fts.hadith_text_id
JOIN hadiths ON hadiths.id = hadith_texts.hadith_id
JOIN collections ON collections.id = hadiths.collection_id
JOIN source_datasets ON source_datasets.id = collections.source_dataset_id
LEFT JOIN books ON books.id = hadiths.book_id
LEFT JOIN chapters ON chapters.id = hadiths.chapter_id
LEFT JOIN hadith_grades ON hadith_grades.hadith_id = hadiths.id
WHERE ${whereSql}
ORDER BY bm25(hadith_texts_fts), collections.collection, CAST(hadiths.hadith_number AS INTEGER), hadiths.hadith_number
LIMIT ${limit} OFFSET ${offset};
`);

      return {
        query: args.query,
        collection: canonicalCollection,
        language,
        limit,
        offset,
        total: countRows[0]?.total ?? 0,
        results: rows.map((row, index): SearchResult => {
          const record = recordFromRow(row, language);
          return {
            ...record,
            snippet: row.snippet,
            rank: offset + index + 1
          };
        }),
        provenance_notes: [`SQLite database: ${db.dbPath}.`, "Search returns source text snippets only, not explanation."]
      };
    },

    validateHadithReference(args) {
      const reference = resolveReference(args.collection, args.hadith_number);
      const row = reference.collection === null ? null : fetchRow(reference.collection, reference.input_hadith_number);
      const collection = reference.collection;
      const referencePrefix = reference.input_hadith_number.split(":")[0] ?? "";
      const collectionSuggestions =
        collection === null
          ? []
          : db.query<SuggestionRow>(`
SELECT hadiths.hadith_number, hadiths.source_url_or_reference
FROM hadiths
JOIN collections ON collections.id = hadiths.collection_id
WHERE collections.collection = ${sqlString(collection)}
  AND (
    hadiths.hadith_number LIKE ${sqlString(`${referencePrefix}:%`)}
    OR hadiths.source_url_or_reference LIKE ${sqlString(`%${reference.input_hadith_number}%`)}
  )
${orderByHadithNumber()}
LIMIT 3;
`);
      const fallbackSuggestions =
        collection === null || collectionSuggestions.length > 0
          ? collectionSuggestions
          : db.query<SuggestionRow>(`
SELECT hadiths.hadith_number, hadiths.source_url_or_reference
FROM hadiths
JOIN collections ON collections.id = hadiths.collection_id
WHERE collections.collection = ${sqlString(collection)}
${orderByHadithNumber()}
LIMIT 3;
`);
      const suggestions =
        collection === null
          ? this.listCollections()
              .collections.slice(0, 3)
              .map((collection) => ({
                collection: collection.collection,
                hadith_number: "1",
                reason: "Known SQLite collection."
              }))
          : fallbackSuggestions.map((suggestion) => ({
              collection,
              hadith_number: suggestion.hadith_number,
              reason: `Available SQLite reference in this collection. Source reference: ${suggestion.source_url_or_reference}.`
            }));

      return {
        valid: row !== null,
        collection: args.collection,
        canonical_collection: reference.collection,
        hadith_number: row?.hadith_number ?? reference.input_hadith_number,
        suggestions: row === null ? suggestions : [],
        provenance_notes: [`SQLite database: ${db.dbPath}.`]
      };
    },

    getHadithMetadata(args) {
      const row = fetchRow(args.collection, args.hadith_number);

      if (row === null) {
        return { result: missingRecordError(db.dbPath, args.collection, args.hadith_number) };
      }

      return {
        result: {
          collection: row.collection,
          display_name: row.display_name,
          book: row.book,
          chapter: row.chapter,
          hadith_number: row.hadith_number,
          numbering: {
            scheme: "collection-local hadith number",
            value: row.hadith_number
          },
          source_dataset: row.source_dataset,
          import_version: row.source_dataset_version,
          provenance_notes: sourceProvenance(row)
        }
      };
    },

    getHadithGrade(args) {
      const row = fetchRow(args.collection, args.hadith_number);

      if (row === null) {
        return { result: missingRecordError(db.dbPath, args.collection, args.hadith_number) };
      }

      const grade = gradeFromRow(row);

      return {
        result: {
          collection: row.collection,
          hadith_number: row.hadith_number,
          grade,
          provenance_notes:
            grade === null
              ? ["No source-attributed grade is available for this record.", ...sourceProvenance(row)]
              : grade.provenance_notes
        }
      };
    }
  };
}
