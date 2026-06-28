export type Language = "arabic" | "english" | "both";

export type CollectionSummary = {
  collection: string;
  display_name: string;
  language_coverage: string[];
  hadith_count: number;
  source_dataset: string;
};

export type Grade = {
  value: string;
  source: string;
  source_reference: string;
  provenance_notes: string[];
};

export type HadithRecord = {
  collection: string;
  display_name: string;
  book: string | null;
  chapter: string | null;
  hadith_number: string;
  arabic_text: string;
  english_text: string | null;
  grade: Grade | null;
  source_dataset: string;
  source_url_or_reference: string;
  provenance_notes: string[];
};

export type SearchResult = HadithRecord & {
  snippet: string;
  rank: number;
};

export type ToolError = {
  error: {
    code: string;
    message: string;
    provenance_notes: string[];
  };
};
