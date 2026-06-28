export const sqliteSchemaSql = `
PRAGMA foreign_keys = ON;

CREATE TABLE source_datasets (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  url TEXT NOT NULL,
  license_note TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  UNIQUE (name, version, content_hash)
);

CREATE TABLE collections (
  id INTEGER PRIMARY KEY,
  collection TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  source_dataset_id INTEGER NOT NULL REFERENCES source_datasets(id)
);

CREATE TABLE books (
  id INTEGER PRIMARY KEY,
  collection_id INTEGER NOT NULL REFERENCES collections(id),
  book_number TEXT,
  title TEXT,
  UNIQUE (collection_id, book_number)
);

CREATE TABLE chapters (
  id INTEGER PRIMARY KEY,
  collection_id INTEGER NOT NULL REFERENCES collections(id),
  book_id INTEGER REFERENCES books(id),
  chapter_number TEXT,
  title TEXT,
  UNIQUE (collection_id, book_id, chapter_number)
);

CREATE TABLE hadiths (
  id INTEGER PRIMARY KEY,
  collection_id INTEGER NOT NULL REFERENCES collections(id),
  hadith_number TEXT NOT NULL,
  book_id INTEGER REFERENCES books(id),
  chapter_id INTEGER REFERENCES chapters(id),
  source_url_or_reference TEXT NOT NULL,
  UNIQUE (collection_id, hadith_number)
);

CREATE TABLE hadith_texts (
  id INTEGER PRIMARY KEY,
  hadith_id INTEGER NOT NULL REFERENCES hadiths(id),
  language TEXT NOT NULL CHECK (language IN ('arabic', 'english')),
  text TEXT NOT NULL,
  search_text TEXT NOT NULL,
  source_dataset_id INTEGER NOT NULL REFERENCES source_datasets(id),
  import_hash TEXT NOT NULL,
  UNIQUE (hadith_id, language)
);

CREATE TABLE hadith_grades (
  id INTEGER PRIMARY KEY,
  hadith_id INTEGER NOT NULL REFERENCES hadiths(id),
  grade_value TEXT NOT NULL,
  grader TEXT NOT NULL,
  source_reference TEXT NOT NULL,
  provenance_note TEXT NOT NULL
);

CREATE TABLE import_warnings (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL,
  collection TEXT NOT NULL,
  hadith_number TEXT NOT NULL,
  message TEXT NOT NULL
);

CREATE VIRTUAL TABLE hadith_texts_fts USING fts5(
  hadith_text_id UNINDEXED,
  collection UNINDEXED,
  hadith_number UNINDEXED,
  language UNINDEXED,
  text,
  tokenize = 'unicode61'
);

CREATE INDEX idx_hadiths_collection_number ON hadiths(collection_id, hadith_number);
CREATE INDEX idx_hadith_texts_hadith_language ON hadith_texts(hadith_id, language);
CREATE INDEX idx_hadith_grades_hadith ON hadith_grades(hadith_id);
`;
