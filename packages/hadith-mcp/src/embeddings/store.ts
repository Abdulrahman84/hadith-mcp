import { existsSync } from "node:fs";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";

import type { EmbeddingProvider } from "./provider.js";
import { embeddingTextForHadith, embeddingTextHash, embeddingTextRecipe } from "./text.js";

type SqliteModule = typeof import("node:sqlite");

// Loaded lazily so the server still starts (with FTS-only search) on Node versions without node:sqlite.
async function loadSqlite(): Promise<SqliteModule> {
  try {
    return await import("node:sqlite");
  } catch (error) {
    throw new Error(
      `node:sqlite is unavailable in Node ${process.version}; embeddings need Node 22.13 or newer. ${
        error instanceof Error ? error.message : ""
      }`.trim()
    );
  }
}

const schemaSql = `
CREATE TABLE IF NOT EXISTS embedding_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS hadith_embeddings (
  hadith_id INTEGER NOT NULL,
  model TEXT NOT NULL,
  dims INTEGER NOT NULL,
  collection TEXT NOT NULL,
  hadith_number TEXT NOT NULL,
  text_hash TEXT NOT NULL,
  vector BLOB NOT NULL,
  PRIMARY KEY (hadith_id, model)
);
CREATE INDEX IF NOT EXISTS idx_hadith_embeddings_model ON hadith_embeddings(model);
`;

type SourceRow = {
  hadith_id: number;
  collection: string;
  hadith_number: string;
  arabic_text: string | null;
  english_text: string | null;
};

export type BuildEmbeddingIndexOptions = {
  sourceDbPath: string;
  outPath: string;
  provider: EmbeddingProvider;
  /** Name the vectors are stored under. Defaults to the provider's model. */
  model?: string | undefined;
  batchSize?: number;
  limit?: number;
  /** Count what is missing or stale without embedding or writing anything. */
  checkOnly?: boolean;
  onProgress?: (progress: { embedded: number; skipped: number; total: number }) => void;
};

export type BuildEmbeddingIndexResult = {
  model: string;
  dims: number | null;
  total: number;
  embedded: number;
  skipped: number;
  removed: number;
  /** Hadith whose vector is missing or stale. Only set by checkOnly runs. */
  pending?: number;
};

function vectorToBlob(vector: Float32Array): Uint8Array {
  return new Uint8Array(vector.buffer, vector.byteOffset, vector.byteLength);
}

function blobToVector(blob: Uint8Array): Float32Array {
  // Copy into a fresh buffer: SQLite blobs are not guaranteed to be 4-byte aligned.
  const copy = new Uint8Array(blob.byteLength);
  copy.set(blob);
  return new Float32Array(copy.buffer);
}

function readSourceRows(db: DatabaseSync, limit: number | undefined): SourceRow[] {
  const sql = `
SELECT
  hadiths.id AS hadith_id,
  collections.collection AS collection,
  hadiths.hadith_number AS hadith_number,
  arabic.text AS arabic_text,
  english.text AS english_text
FROM hadiths
JOIN collections ON collections.id = hadiths.collection_id
LEFT JOIN hadith_texts AS arabic ON arabic.hadith_id = hadiths.id AND arabic.language = 'arabic'
LEFT JOIN hadith_texts AS english ON english.hadith_id = hadiths.id AND english.language = 'english'
ORDER BY hadiths.id
${limit === undefined ? "" : `LIMIT ${Math.max(0, Math.floor(limit))}`};
`;

  return db.prepare(sql).all() as unknown as SourceRow[];
}

export async function openEmbeddingStore(outPath: string): Promise<DatabaseSync> {
  const { DatabaseSync } = await loadSqlite();
  const db = new DatabaseSync(path.resolve(outPath));
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(schemaSql);
  return db;
}

/**
 * Embeds every hadith in the source DB into a separate SQLite file. Rows whose text hash
 * already matches for this model are skipped, so an interrupted build resumes where it stopped.
 */
export async function buildEmbeddingIndex(options: BuildEmbeddingIndexOptions): Promise<BuildEmbeddingIndexResult> {
  const { DatabaseSync } = await loadSqlite();
  const sourcePath = path.resolve(options.sourceDbPath);

  if (!existsSync(sourcePath)) {
    throw new Error(`Source SQLite database not found: ${sourcePath}`);
  }

  const source = new DatabaseSync(sourcePath, { readOnly: true });
  if (options.checkOnly && !existsSync(path.resolve(options.outPath))) {
    throw new Error(`Embedding index not found: ${path.resolve(options.outPath)}`);
  }

  const store = await openEmbeddingStore(options.outPath);
  const model = options.model?.trim() || options.provider.model;
  const batchSize = Math.max(1, options.batchSize ?? 32);

  try {
    const rows = readSourceRows(source, options.limit);
    const existing = new Map<number, string>();

    for (const row of store
      .prepare("SELECT hadith_id, text_hash FROM hadith_embeddings WHERE model = ?")
      .all(model) as unknown as { hadith_id: number; text_hash: string }[]) {
      existing.set(row.hadith_id, row.text_hash);
    }

    const pending = rows
      .map((row) => {
        const text = embeddingTextForHadith(row.arabic_text, row.english_text);
        return { row, text, hash: embeddingTextHash(text) };
      })
      .filter((item) => item.text.length > 0 && existing.get(item.row.hadith_id) !== item.hash);

    const total = rows.length;
    const skipped = total - pending.length;
    let embedded = 0;
    let dims: number | null =
      (store.prepare("SELECT dims FROM hadith_embeddings WHERE model = ? LIMIT 1").get(model) as { dims?: number } | undefined)?.dims ?? null;

    if (options.checkOnly) {
      return { model, dims, total, embedded, skipped, removed: 0, pending: pending.length };
    }

    const upsert = store.prepare(`
INSERT INTO hadith_embeddings (hadith_id, model, dims, collection, hadith_number, text_hash, vector)
VALUES (?, ?, ?, ?, ?, ?, ?)
ON CONFLICT (hadith_id, model) DO UPDATE SET
  dims = excluded.dims,
  collection = excluded.collection,
  hadith_number = excluded.hadith_number,
  text_hash = excluded.text_hash,
  vector = excluded.vector;
`);

    options.onProgress?.({ embedded, skipped, total });

    for (let start = 0; start < pending.length; start += batchSize) {
      const batch = pending.slice(start, start + batchSize);
      const vectors = await options.provider.embed(batch.map((item) => item.text));

      store.exec("BEGIN");
      try {
        batch.forEach((item, index) => {
          const vector = vectors[index]!;

          if (dims === null) {
            dims = vector.length;
          } else if (vector.length !== dims) {
            throw new Error(`Embedding dimension changed from ${dims} to ${vector.length} for model ${model}.`);
          }

          upsert.run(
            item.row.hadith_id,
            model,
            vector.length,
            item.row.collection,
            item.row.hadith_number,
            item.hash,
            vectorToBlob(vector)
          );
        });
        store.exec("COMMIT");
      } catch (error) {
        store.exec("ROLLBACK");
        throw error;
      }

      embedded += batch.length;
      options.onProgress?.({ embedded, skipped, total });
    }

    // Drop vectors for hadith ids that no longer exist in the source (only on full builds).
    let removed = 0;
    if (options.limit === undefined) {
      const liveIds = new Set(rows.map((row) => row.hadith_id));
      const stale = (store.prepare("SELECT hadith_id FROM hadith_embeddings WHERE model = ?").all(model) as unknown as {
        hadith_id: number;
      }[]).filter((row) => !liveIds.has(row.hadith_id));
      const remove = store.prepare("DELETE FROM hadith_embeddings WHERE model = ? AND hadith_id = ?");
      for (const row of stale) {
        remove.run(model, row.hadith_id);
      }
      removed = stale.length;
    }

    const setMeta = store.prepare("INSERT INTO embedding_meta (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value");
    setMeta.run(`model:${model}:built_at`, new Date().toISOString());
    setMeta.run(`model:${model}:recipe`, embeddingTextRecipe);
    setMeta.run(`model:${model}:source_db`, path.basename(sourcePath));

    return { model, dims, total, embedded, skipped, removed };
  } finally {
    source.close();
    // Leave a single self-contained file (no -wal/-shm) so read-only loads and copies work.
    store.exec("PRAGMA wal_checkpoint(TRUNCATE);");
    store.exec("PRAGMA journal_mode = DELETE;");
    store.close();
  }
}

export type LoadedEmbeddingIndex = {
  model: string;
  dims: number;
  size: number;
  collections: string[];
  hadithNumbers: string[];
  /** Row-major, L2-normalized vectors: size × dims. */
  matrix: Float32Array;
};

export async function loadEmbeddingIndex(indexPath: string, model: string): Promise<LoadedEmbeddingIndex> {
  const resolved = path.resolve(indexPath);

  if (!existsSync(resolved)) {
    throw new Error(`Embedding index not found: ${resolved}`);
  }

  const { DatabaseSync } = await loadSqlite();
  const db = new DatabaseSync(resolved, { readOnly: true });

  try {
    const dimsRows = db.prepare("SELECT DISTINCT dims FROM hadith_embeddings WHERE model = ?").all(model) as unknown as {
      dims: number;
    }[];

    if (dimsRows.length === 0) {
      const models = (db.prepare("SELECT DISTINCT model FROM hadith_embeddings").all() as unknown as { model: string }[]).map(
        (row) => row.model
      );
      throw new Error(
        `Embedding index has no vectors for model ${model}${models.length > 0 ? ` (available: ${models.join(", ")})` : ""}.`
      );
    }

    if (dimsRows.length > 1) {
      throw new Error(`Embedding index has mixed dimensions for model ${model}.`);
    }

    const dims = dimsRows[0]!.dims;
    const count = (db.prepare("SELECT COUNT(*) AS count FROM hadith_embeddings WHERE model = ?").get(model) as { count: number })
      .count;
    const matrix = new Float32Array(count * dims);
    const collections: string[] = [];
    const hadithNumbers: string[] = [];
    let row = 0;

    // Stream rows straight into the matrix so peak memory stays close to the index size.
    for (const record of db
      .prepare("SELECT collection, hadith_number, vector FROM hadith_embeddings WHERE model = ? ORDER BY hadith_id")
      .iterate(model) as Iterable<{ collection: string; hadith_number: string; vector: Uint8Array }>) {
      if (row >= count) {
        break;
      }

      matrix.set(blobToVector(record.vector), row * dims);
      collections.push(record.collection);
      hadithNumbers.push(record.hadith_number);
      row += 1;
    }

    return { model, dims, size: row, collections, hadithNumbers, matrix: row === count ? matrix : matrix.subarray(0, row * dims) };
  } finally {
    db.close();
  }
}
