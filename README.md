# hadith-mcp

`hadith-mcp` is a Model Context Protocol server for retrieving hadith text and metadata from auditable sources.

The project goal is to give AI assistants and developer tools a strict source layer for the Sunnah: exact references, Arabic text, available English translations, source-attributed grading, and clear provenance. The MCP server should retrieve and cite source material; it should not act as a mufti or generate unsupported religious claims.

## V1 Direction

- TypeScript MCP server distributed as a local npm package.
- Read-only SQLite database with FTS5 search.
- Initial target scope: the Six Books.
- Arabic text required for imported hadith.
- English text included when the selected source provides it.
- Grades exposed only when they are source-attributed.
- No model-generated explanation or interpretation returned by MCP tools.

## Implemented MCP Tools

- `list_collections`
- `fetch_hadith`
- `search_hadith`
- `semantic_search_hadith` (hybrid full-text + embedding search)
- `validate_hadith_reference`
- `get_hadith_metadata`
- `get_hadith_grade`

See [docs/mcp-tools.md](docs/mcp-tools.md) for the implemented interface.

See [docs/client-setup.md](docs/client-setup.md) for local MCP client configuration examples.

See [docs/v1-build-plan.md](docs/v1-build-plan.md) for the implementation plan, release gates, and first sprint.

See [docs/future-product-plan.md](docs/future-product-plan.md) for how this MCP should support a later Quran/Hadith AI product in a separate repository.

## Local Development

```bash
npm install
npm run typecheck
npm test
npm run build
npm run audit:meeatif-hadith-datasets
npm run build:fixture-sqlite
npm run build:meeatif-sqlite
npm run docs:dev
node packages/hadith-mcp/dist/cli.js
HADITH_MCP_DB_PATH=data/generated/hadith-meeatif.sqlite node packages/hadith-mcp/dist/cli.js
```

Without `HADITH_MCP_DB_PATH`, the MCP server runs against synthetic fixture records for schema and client integration tests. The fixture records are not real hadith text and must not be used for religious claims.

The meeAtif audit command writes the active candidate-source report to `data/generated/`.

The fixture SQLite command writes a synthetic non-release database to `data/generated/hadith-fixture.sqlite`.

The meeAtif SQLite command writes a local candidate database to `data/generated/hadith-meeatif.sqlite` and import reports to `data/generated/hadith-meeatif-import-report.{json,md}` after the project owner accepted the source-chain risk for local v1 import work. Set `HADITH_MCP_DB_PATH` to this database path to run SQLite-backed MCP tools locally. Generated SQLite artifacts remain ignored by git until a later release decision includes the required data-license notice.

The meeAtif importer uses in-book references as canonical `hadith_number` values, such as `10:1`, rather than simple collection-wide numbers. SQLite-backed lookup also accepts collection-prefixed references such as `bukhari:10:1` and source references such as `https://sunnah.com/bukhari:603` or `bukhari:603` when the source row provides them. Use `validate_hadith_reference` for suggestions when an exact lookup misses.

### Semantic search embeddings

`semantic_search_hadith` needs a vector index built from the SQLite database. The index is a separate file, so the source database is never modified.

```bash
ollama pull bge-m3
npm run build:embeddings
HADITH_MCP_DB_PATH=data/generated/hadith-meeatif.sqlite \
HADITH_MCP_EMBEDDINGS_PATH=data/generated/hadith-embeddings.sqlite \
node packages/hadith-mcp/dist/cli.js
```

`build:embeddings` reads `HADITH_MCP_DB_PATH` (default `data/generated/hadith-meeatif.sqlite`) and writes `data/generated/hadith-embeddings.sqlite`. Pass `-- --db <path> --out <path> --batch-size 32 --limit 100` to override. The build is resumable: rerunning it only embeds hadith whose text or embedding recipe changed. Use `EMBEDDINGS_PROVIDER=openai` with `EMBEDDINGS_BASE_URL`, `EMBEDDINGS_API_KEY` and `EMBEDDINGS_MODEL` to build with a hosted embedding API instead of Ollama; the server must then embed queries with the same model.

To verify an existing index against the database without embedding anything (for example after downloading a prebuilt index), run `node packages/hadith-mcp/dist/build-embeddings.js --check`. It exits non-zero when more than `--max-stale-ratio` (default 0.01) of hadith have a missing or stale vector. Set `EMBEDDINGS_INDEX_MODEL` when the index was stored under a different model name than the query API uses.

Each hadith gets one vector from its Arabic text (harakat removed, isnad kept because the dataset has no reliable isnad/matn boundary) followed by its English translation. Search is exact cosine similarity over the index loaded into memory (about 140 MB for 34k hadith at 1024 dimensions), which needs Node 22.13 or newer for `node:sqlite`.

A client that already embedded the question with the same model (for example to search its own Quran index) can pass the vector as `query_embedding`, with `query_embedding_model`, and the server skips its own embedding call. A vector from another model or with other dimensions is ignored and the server embeds the query itself. See [docs/mcp-tools.md](docs/mcp-tools.md#semantic_search_hadith).

The docs website lives in `apps/docs` and is built with Next.js and Tailwind CSS. During development it runs at `http://127.0.0.1:3000` by default. Arabic is the default page at `/`, with English at `/en`.

## Future Product Direction

The Hadith MCP is intended to become one source layer for a broader Islamic source retrieval product that should live in a separate repository:

- Tafsir MCP handles Quran and tafsir retrieval.
- Hadith MCP handles Sunnah retrieval.
- A public web app can orchestrate both.
- An open-source/open-weight model can provide retrieval-grounded cited answers, using the MCPs as the source of truth.

## Current Status

This repository currently contains the project plan, source policy, v1 build plan, a TypeScript MCP server with fixture and SQLite-backed modes, and a local meeAtif import path for candidate SQLite builds.
