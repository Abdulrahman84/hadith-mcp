# MCP Tools

The implementation registers all six v1 tools. By default the server uses synthetic fixture data for schema and MCP client integration tests; when `HADITH_MCP_DB_PATH` is set, it reads from the configured SQLite database.

## `list_collections`

Returns available collections and metadata.

Expected fields:

- `collection`
- `display_name`
- `language_coverage`
- `hadith_count`
- `source_dataset`

## `fetch_hadith`

Fetches one hadith by collection and reference, returning a cited source record or a structured `hadith_not_found` error.

Inputs:

- `collection`
- `hadith_number`: accepts canonical in-book references such as `10:1`, collection-prefixed references such as `bukhari:10:1`, and source references such as `https://sunnah.com/bukhari:603` when present in the SQLite source row
- `language` optional, default `both`

Response must include:

- `collection`
- `book`
- `chapter`
- `hadith_number`
- `arabic_text`
- `english_text`
- `grade`
- `source_dataset`
- `source_url_or_reference`
- `provenance_notes`

## `search_hadith`

Searches Arabic and/or English hadith text.

Returns snippets plus provenance notes. It does not return generated explanations.

Inputs:

- `query`
- `collection` optional
- `language` optional
- `limit` optional
- `offset` optional

Returns ranked source records with snippets and references. It must not return generated explanations.

## `semantic_search_hadith`

Hybrid search: runs `search_hadith` full-text search and an embedding similarity search, then merges both ranked lists with reciprocal rank fusion (k = 60). It finds hadith whose wording differs from the query (for example an English question about an Arabic-only text, or a paraphrase).

Inputs are the same as `search_hadith`, plus:

- `mode` optional: `hybrid` (default), `fts`, or `vector`. The single-retriever modes exist to compare retrievers on the same query.
- `vector_weight` optional, 0..1: in hybrid mode, the vector list's share of the weighted RRF score (score = Σ wᵢ / (60 + rankᵢ)); full-text gets `1 - vector_weight`. Defaults to `HADITH_MCP_VECTOR_WEIGHT`, else 0.5 (plain RRF).

Returns the `search_hadith` output plus:

- `mode`: the mode that ran, or `fts_fallback` when no embedding index or provider is available. The fallback reason is in `provenance_notes`.
- `vector_weight`: the weight used (1 for vector mode, null for full-text results).
- `results[].scores`: `rrf`, `fts_rank`, `vector_rank`, `vector_similarity` (null where a list did not contain the record).

Vector similarity only ranks candidates. It does not verify a quotation, so callers must still check the cited text.

Configuration (server environment):

- `HADITH_MCP_EMBEDDINGS_PATH`: the index file built by `npm run build:embeddings`. Without it the tool returns full-text results.
- `EMBEDDINGS_PROVIDER`: `ollama` (default), `openai` (any OpenAI-compatible `/embeddings` API), or `none`.
- `HADITH_MCP_VECTOR_WEIGHT`: default hybrid vector weight (0..1).
- `OLLAMA_URL` (default `http://127.0.0.1:11434`), `EMBEDDINGS_MODEL` (default `bge-m3`), `EMBEDDINGS_TIMEOUT_MS`.
- `EMBEDDINGS_BASE_URL`, `EMBEDDINGS_API_KEY` for the OpenAI-compatible provider.
- `EMBEDDINGS_INDEX_MODEL`: the model name the index was built under, when the query API names the same model differently. For example, an index built with Ollama as `bge-m3` can be queried through OpenRouter (`EMBEDDINGS_BASE_URL=https://openrouter.ai/api/v1`, `EMBEDDINGS_MODEL=baai/bge-m3`) with `EMBEDDINGS_INDEX_MODEL=bge-m3`. Defaults to `EMBEDDINGS_MODEL`.

The query must be embedded with the same model that built the index; a mismatch falls back to full-text search. Ollama's `bge-m3` and OpenRouter's `baai/bge-m3` return the same vectors (cosine similarity 0.99999 on sample texts), so one index works with either.

## `validate_hadith_reference`

Checks whether a collection and hadith number exist.

Returns suggestions for unknown references when possible. SQLite-backed mode returns canonical `hadith_number` values after resolving source references.

Inputs:

- `collection`
- `hadith_number`

Returns a structured valid/invalid result with suggestions when possible.

## `get_hadith_metadata`

Returns non-text metadata for a hadith, including numbering, source dataset, import version, and provenance notes.

Inputs:

- `collection`
- `hadith_number`

Expected metadata:

- book and chapter
- numbering details
- source dataset
- import version
- provenance notes

## `get_hadith_grade`

Returns source-attributed grade metadata when available.

If no attributed grade exists in the configured data, the tool returns `grade: null` with provenance notes.

Inputs:

- `collection`
- `hadith_number`

If no attributed grade is available, the tool must return `grade: null` and explain the missing attribution in `provenance_notes`.
