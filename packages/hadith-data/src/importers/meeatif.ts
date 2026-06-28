import { meeAtifSixBooks, type MeeAtifBookKey, type MeeAtifRow } from "../audit/meeatif-hadith-datasets.js";
import type { NormalizedHadithSqliteRow } from "../sqlite/builder.js";

export type MeeAtifImportWarning = {
  code: "missing_english" | "missing_grade" | "unparseable_reference";
  collection: string;
  source_reference: string;
  message: string;
};

export type MeeAtifImportResult = {
  rows: NormalizedHadithSqliteRow[];
  warnings: MeeAtifImportWarning[];
};

export type MeeAtifBookInput = {
  key: MeeAtifBookKey;
  displayName: string;
  file: string;
  rows: MeeAtifRow[];
};

const collectionAliases: Record<MeeAtifBookKey, string> = {
  bukhari: "bukhari",
  muslim: "muslim",
  abudawud: "abu_dawud",
  tirmidhi: "tirmidhi",
  nasai: "nasai",
  ibnmajah: "ibn_majah"
};

function parseSunnahReference(reference: string): { collection: string; hadithNumber: string } | null {
  const match = reference.match(/^https:\/\/sunnah\.com\/([^:]+):(.+)$/);
  if (!match) {
    return null;
  }

  const [, collection, hadithNumber] = match;
  if (collection === undefined || hadithNumber === undefined) {
    return null;
  }

  return { collection, hadithNumber };
}

function parseBookNumber(inBookReference: string | undefined): string | null {
  const match = inBookReference?.match(/Book\s+([^,\s]+)/i);
  return match?.[1] ?? null;
}

function parseInBookHadithNumber(inBookReference: string | undefined): string | null {
  const match = inBookReference?.match(/Book\s+([^,\s]+),\s*Hadith\s+(.+)$/i);
  if (!match) {
    return null;
  }

  const book = match[1];
  const hadith = match[2];
  if (book === undefined || hadith === undefined) {
    return null;
  }

  return `${book.trim()}:${hadith.trim()}`;
}

function normalizeGrade(grade: string | undefined): NormalizedHadithSqliteRow["grade"] {
  const value = grade?.trim() ?? "";
  if (value.length === 0) {
    return null;
  }

  const sourceMatch = value.match(/\(([^)]+)\)\s*$/);
  const source = sourceMatch?.[1]?.trim() ?? "meeAtif dataset";
  const cleanValue = value.replace(/\s*\([^)]+\)\s*$/, "").trim();

  return {
    value: cleanValue,
    source,
    source_reference: "meeAtif/hadith_datasets Grade field"
  };
}

export function normalizeMeeAtifBooks(args: {
  books: MeeAtifBookInput[];
  datasetVersion: string;
  datasetUrl: string;
  licenseNote: string;
}): MeeAtifImportResult {
  const rows: NormalizedHadithSqliteRow[] = [];
  const warnings: MeeAtifImportWarning[] = [];

  for (const book of args.books) {
    const canonicalCollection = collectionAliases[book.key];
    for (const sourceRow of book.rows) {
      const sourceReference = sourceRow.Reference?.trim() ?? "";
      const parsedReference = parseSunnahReference(sourceReference);

      if (parsedReference === null) {
        warnings.push({
          code: "unparseable_reference",
          collection: canonicalCollection,
          source_reference: sourceReference,
          message: "Could not parse Sunnah.com reference."
        });
        continue;
      }

      const arabicText = sourceRow.Arabic_Text?.trim() ?? "";
      const englishText = sourceRow.English_Text?.trim() ?? "";
      const grade = normalizeGrade(sourceRow.Grade);
      if (englishText.length === 0) {
        warnings.push({
          code: "missing_english",
          collection: canonicalCollection,
          source_reference: sourceReference,
          message: "English text is missing; row will be imported with english_text null."
        });
      }
      if (grade === null) {
        warnings.push({
          code: "missing_grade",
          collection: canonicalCollection,
          source_reference: sourceReference,
          message: "No source-attributed grade is present; MCP should return grade null."
        });
      }

      rows.push({
        collection: canonicalCollection,
        display_name: book.displayName,
        hadith_number: parseInBookHadithNumber(sourceRow["In-book reference"]) ?? parsedReference.hadithNumber,
        book_number: parseBookNumber(sourceRow["In-book reference"]),
        book: sourceRow.Book?.trim() ?? book.displayName,
        chapter_number: String(sourceRow.Chapter_Number ?? "").trim() || null,
        chapter: sourceRow.Chapter_Title_English?.trim() ?? null,
        arabic_text: arabicText,
        english_text: englishText.length === 0 ? null : englishText,
        grade,
        source_dataset: "meeAtif/hadith_datasets",
        source_dataset_version: args.datasetVersion,
        source_dataset_url: args.datasetUrl,
        source_license_note: args.licenseNote,
        source_url_or_reference: sourceReference,
        provenance_note:
          "Imported from meeAtif/hadith_datasets after project owner accepted source-chain risk for local v1 candidate build."
      });
    }
  }

  return { rows, warnings };
}

export async function fetchMeeAtifBookInputs(ref: string): Promise<MeeAtifBookInput[]> {
  const inputs: MeeAtifBookInput[] = [];

  for (const book of meeAtifSixBooks) {
    const url = `https://huggingface.co/datasets/meeAtif/hadith_datasets/resolve/${encodeURIComponent(ref)}/${encodeURIComponent(book.file)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    inputs.push({
      key: book.key,
      displayName: book.displayName,
      file: book.file,
      rows: (await response.json()) as MeeAtifRow[]
    });
  }

  return inputs;
}
