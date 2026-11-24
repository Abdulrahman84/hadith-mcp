import type { LoadedEmbeddingIndex } from "../embeddings/store.js";

export type VectorHit = {
  collection: string;
  hadith_number: string;
  similarity: number;
};

/**
 * Exact cosine search over the in-memory matrix. Vectors are pre-normalized, so the dot
 * product is the cosine similarity. 34k × 1024 floats is ~35M multiply-adds per query,
 * which is tens of milliseconds and avoids a native vector extension.
 */
export function searchVectorIndex(
  index: LoadedEmbeddingIndex,
  query: Float32Array,
  options: { k: number; collection?: string | null }
): VectorHit[] {
  if (query.length !== index.dims) {
    throw new Error(`Query embedding has ${query.length} dimensions; the index has ${index.dims}.`);
  }

  const k = Math.max(0, Math.floor(options.k));
  const top: { row: number; score: number }[] = [];
  const { matrix, dims } = index;

  if (k === 0) {
    return [];
  }

  for (let row = 0; row < index.size; row += 1) {
    if (options.collection && index.collections[row] !== options.collection) {
      continue;
    }

    let score = 0;
    const offset = row * dims;
    for (let dim = 0; dim < dims; dim += 1) {
      score += matrix[offset + dim]! * query[dim]!;
    }

    if (top.length < k) {
      top.push({ row, score });
      top.sort((left, right) => right.score - left.score);
    } else if (score > top[top.length - 1]!.score) {
      top[top.length - 1] = { row, score };
      top.sort((left, right) => right.score - left.score);
    }
  }

  return top.map(({ row, score }) => ({
    collection: index.collections[row]!,
    hadith_number: index.hadithNumbers[row]!,
    similarity: score
  }));
}
