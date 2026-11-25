import { canonicalizeCollection } from "../collections.js";
import { normalizeVector, type EmbeddingProvider } from "../embeddings/provider.js";
import { loadEmbeddingIndex, type LoadedEmbeddingIndex } from "../embeddings/store.js";
import { embeddingQueryText } from "../embeddings/text.js";
import type { HadithService } from "../tools/service.js";
import type { Language, SearchResult } from "../types.js";
import { defaultRrfK, reciprocalRankFusion } from "./rrf.js";
import { searchVectorIndex, type VectorHit } from "./vector-index.js";

export type SemanticSearchMode = "hybrid" | "fts" | "vector";

export type HybridSearchArgs = Parameters<HadithService["searchHadith"]>[0] & {
  mode?: SemanticSearchMode | undefined;
  /** 0..1 share of the fused score given to the vector list; full-text gets the rest. */
  vector_weight?: number | undefined;
  /** The caller's embedding of `query`, so the server doesn't embed it again. */
  query_embedding?: number[] | undefined;
  /** The model query_embedding was made with; it must match the index. */
  query_embedding_model?: string | undefined;
};

export type HybridScores = {
  rrf: number | null;
  fts_rank: number | null;
  vector_rank: number | null;
  vector_similarity: number | null;
};

export type HybridSearchResult = SearchResult & { scores: HybridScores };

export type QueryEmbeddingSource = "caller" | "server";

export type HybridSearchOutput = {
  query: string;
  collection: string | null;
  language: Language;
  limit: number;
  offset: number;
  total: number;
  mode: SemanticSearchMode | "fts_fallback";
  vector_weight: number | null;
  /** Where the query vector came from; null for full-text results. */
  query_embedding_source: QueryEmbeddingSource | null;
  results: HybridSearchResult[];
  provenance_notes: string[];
};

export type HybridSearcher = {
  semanticSearchHadith(args: HybridSearchArgs): Promise<HybridSearchOutput>;
};

export type HybridSearcherOptions = {
  service: HadithService;
  indexPath?: string | null | undefined;
  provider?: EmbeddingProvider | null | undefined;
  /** Model name the index stores vectors under. Defaults to the provider's model. */
  indexModel?: string | undefined;
  ftsCandidates?: number;
  vectorCandidates?: number;
  rrfK?: number;
  /** Used when a call does not pass vector_weight. Defaults to 0.5 (plain RRF). */
  defaultVectorWeight?: number | undefined;
  loadIndex?: (indexPath: string, model: string) => Promise<LoadedEmbeddingIndex>;
};

type QueryVector = { vector: Float32Array; source: QueryEmbeddingSource; note: string | null };

export const defaultVectorWeight = 0.5;
const indexRetryMs = 60_000;
const snippetChars = 300;

function resultKey(collection: string, hadithNumber: string): string {
  return `${collection}:${hadithNumber}`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function clampWeight(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(1, Math.max(0, value));
}

function fullTextArgs(args: HybridSearchArgs): Parameters<HadithService["searchHadith"]>[0] {
  const { mode: _mode, vector_weight: _weight, query_embedding: _vector, query_embedding_model: _model, ...searchArgs } = args;
  return searchArgs;
}

/**
 * Checks a caller's query_embedding against the loaded index. Returns the vector, normalized again
 * (a no-op for a normalized one), or why it can't be used. The model may be named as the index
 * names it (EMBEDDINGS_INDEX_MODEL) or as the server's provider does (EMBEDDINGS_MODEL).
 */
export function checkQueryEmbedding(
  args: Pick<HybridSearchArgs, "query_embedding" | "query_embedding_model">,
  index: Pick<LoadedEmbeddingIndex, "model" | "dims">,
  providerModel?: string | undefined
): { vector: Float32Array } | { reason: string } {
  const values = args.query_embedding ?? [];
  const model = args.query_embedding_model?.trim();

  if (!model) {
    return { reason: "query_embedding_model is missing." };
  }

  if (model !== index.model && model !== providerModel) {
    return { reason: `it was made with ${model}, but the index holds ${index.model} vectors.` };
  }

  if (values.length !== index.dims) {
    return { reason: `it has ${values.length} dimensions; the index has ${index.dims}.` };
  }

  if (!values.every(Number.isFinite) || values.every((value) => value === 0)) {
    return { reason: "it is all zeros or has non-finite values." };
  }

  return { vector: normalizeVector(values) };
}

export function createHybridSearcher(options: HybridSearcherOptions): HybridSearcher {
  const { service } = options;
  const ftsCandidates = options.ftsCandidates ?? 30;
  const vectorCandidates = options.vectorCandidates ?? 30;
  const rrfK = options.rrfK ?? defaultRrfK;
  const fallbackWeight = clampWeight(options.defaultVectorWeight, defaultVectorWeight);
  const loadIndex = options.loadIndex ?? loadEmbeddingIndex;
  const indexes = new Map<string, { promise: Promise<LoadedEmbeddingIndex>; failedAt: number }>();

  // Keyed by model: without a provider, the model comes from the caller's query_embedding_model.
  function getIndex(indexPath: string, model: string): Promise<LoadedEmbeddingIndex> {
    const cached = indexes.get(model);

    if (cached && (cached.failedAt === 0 || Date.now() - cached.failedAt <= indexRetryMs)) {
      return cached.promise;
    }

    const entry = { promise: loadIndex(indexPath, model), failedAt: 0 };
    entry.promise.catch(() => {
      entry.failedAt = Date.now();
    });
    indexes.set(model, entry);
    return entry.promise;
  }

  async function queryVectorFor(args: HybridSearchArgs, index: LoadedEmbeddingIndex): Promise<QueryVector> {
    let rejection: string | null = null;

    if (args.query_embedding !== undefined) {
      const checked = checkQueryEmbedding(args, index, options.provider?.model);

      if ("vector" in checked) {
        return { vector: checked.vector, source: "caller", note: null };
      }

      rejection = `Ignored the caller's query_embedding: ${checked.reason}`;
    }

    if (!options.provider) {
      throw new Error(`${rejection ?? "No query_embedding was given."} No embedding provider is configured to embed the query instead.`);
    }

    const [vector] = await options.provider.embed([(options.provider.queryPrefix ?? "") + embeddingQueryText(args.query)]);

    if (!vector) {
      throw new Error("embedding provider returned no vector for the query.");
    }

    return { vector, source: "server", note: rejection === null ? null : `${rejection} Embedded the query on the server instead.` };
  }

  function ftsOnly(args: HybridSearchArgs, reason: string | null): HybridSearchOutput {
    const output = service.searchHadith(fullTextArgs(args));

    return {
      ...output,
      mode: reason === null ? "fts" : "fts_fallback",
      vector_weight: null,
      query_embedding_source: null,
      results: output.results.map((result) => ({
        ...result,
        scores: { rrf: null, fts_rank: result.rank, vector_rank: null, vector_similarity: null }
      })),
      provenance_notes:
        reason === null
          ? output.provenance_notes
          : [...output.provenance_notes, `Semantic search unavailable; returned full-text results only. Reason: ${reason}`]
    };
  }

  function recordForVectorHit(hit: VectorHit, language: Language, rank: number): SearchResult | null {
    const fetched = service.fetchHadith({ collection: hit.collection, hadith_number: hit.hadith_number, language });

    if ("error" in fetched.result) {
      return null;
    }

    const record = fetched.result;
    const text =
      language === "english"
        ? record.english_text ?? ""
        : language === "arabic"
          ? record.arabic_text
          : record.arabic_text || record.english_text || "";

    if (text.length === 0) {
      return null;
    }

    return { ...record, snippet: text.slice(0, snippetChars), rank };
  }

  return {
    async semanticSearchHadith(args) {
      const mode = args.mode ?? "hybrid";
      const language = args.language ?? "both";
      const limit = args.limit ?? 10;
      const offset = args.offset ?? 0;
      const canonicalCollection = args.collection === undefined ? null : canonicalizeCollection(args.collection);
      const vectorWeight = mode === "vector" ? 1 : clampWeight(args.vector_weight, fallbackWeight);

      if (mode === "fts") {
        return ftsOnly(args, null);
      }

      if (args.query.trim().length === 0 || (args.collection !== undefined && canonicalCollection === null)) {
        return ftsOnly(args, args.query.trim().length === 0 ? "empty query." : "unknown collection filter.");
      }

      if (!options.indexPath) {
        return ftsOnly(args, "no embedding index configured (HADITH_MCP_EMBEDDINGS_PATH).");
      }

      // A server without a provider can still search the index with a caller's vector.
      const indexModel = options.indexModel ?? options.provider?.model ?? args.query_embedding_model?.trim();

      if (!indexModel || (!options.provider && args.query_embedding === undefined)) {
        return ftsOnly(args, "no embedding provider configured.");
      }

      let vectorHits: VectorHit[];
      let index: LoadedEmbeddingIndex;
      let queryVector: QueryVector;

      try {
        index = await getIndex(options.indexPath, indexModel);
        queryVector = await queryVectorFor(args, index);
        vectorHits = searchVectorIndex(index, queryVector.vector, {
          k: mode === "vector" ? Math.max(vectorCandidates, offset + limit) : vectorCandidates,
          collection: canonicalCollection
        });
      } catch (error) {
        return ftsOnly(args, errorMessage(error));
      }

      const ftsWeight = 1 - vectorWeight;
      const fts =
        ftsWeight > 0
          ? service.searchHadith({ ...fullTextArgs(args), limit: ftsCandidates, offset: 0 })
          : { results: [] as SearchResult[], provenance_notes: [] as string[] };
      const ftsByKey = new Map(fts.results.map((result) => [resultKey(result.collection, result.hadith_number), result]));
      const vectorByKey = new Map(vectorHits.map((hit) => [resultKey(hit.collection, hit.hadith_number), hit]));
      const fused = reciprocalRankFusion(
        [
          { name: "fts", weight: ftsWeight, keys: fts.results.map((result) => resultKey(result.collection, result.hadith_number)) },
          { name: "vector", weight: vectorWeight, keys: vectorHits.map((hit) => resultKey(hit.collection, hit.hadith_number)) }
        ],
        rrfK
      );

      const results: HybridSearchResult[] = [];
      let dropped = 0;

      for (const item of fused) {
        if (results.length >= offset + limit) {
          break;
        }

        const rank = results.length + 1;
        const ftsResult = ftsByKey.get(item.key);
        const vectorHit = vectorByKey.get(item.key);
        const base = ftsResult ? { ...ftsResult, rank } : vectorHit ? recordForVectorHit(vectorHit, language, rank) : null;

        if (base === null) {
          dropped += 1;
          continue;
        }

        results.push({
          ...base,
          scores: {
            rrf: item.score,
            fts_rank: item.ranks.fts ?? null,
            vector_rank: item.ranks.vector ?? null,
            vector_similarity: vectorHit ? Number(vectorHit.similarity.toFixed(6)) : null
          }
        });
      }

      const fusionNote =
        mode === "vector"
          ? `Vector-only search: top ${vectorHits.length} by cosine similarity.`
          : `Hybrid search: weighted reciprocal rank fusion (k=${rrfK}, vector weight ${vectorWeight}, full-text weight ${Number(ftsWeight.toFixed(4))}) of full-text top ${ftsCandidates} (${fts.results.length} hits) and vector top ${vectorCandidates} (${vectorHits.length} hits).`;
      const embeddedBy = queryVector.source === "caller" ? "the caller's query_embedding" : options.provider?.name;

      return {
        query: args.query,
        collection: canonicalCollection,
        language,
        limit,
        offset,
        total: fused.length - dropped,
        mode,
        vector_weight: vectorWeight,
        query_embedding_source: queryVector.source,
        results: results.slice(offset, offset + limit),
        provenance_notes: [
          ...fts.provenance_notes,
          fusionNote,
          `Embedding model: ${index.model} via ${embeddedBy}; index size ${index.size} hadith, ${index.dims} dimensions.`,
          ...(queryVector.note === null ? [] : [queryVector.note]),
          "Vector similarity finds related wording; it does not verify a quotation. Check the cited text."
        ]
      };
    }
  };
}
