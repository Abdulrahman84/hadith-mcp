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
node packages/hadith-mcp/dist/cli.js
HADITH_MCP_DB_PATH=data/generated/hadith-meeatif.sqlite node packages/hadith-mcp/dist/cli.js
```

Without `HADITH_MCP_DB_PATH`, the MCP server runs against synthetic fixture records for schema and client integration tests. The fixture records are not real hadith text and must not be used for religious claims.

The meeAtif audit command writes the active candidate-source report to `data/generated/`.

The fixture SQLite command writes a synthetic non-release database to `data/generated/hadith-fixture.sqlite`.

The meeAtif SQLite command writes a local candidate database to `data/generated/hadith-meeatif.sqlite` and import reports to `data/generated/hadith-meeatif-import-report.{json,md}` after the project owner accepted the source-chain risk for local v1 import work. Set `HADITH_MCP_DB_PATH` to this database path to run SQLite-backed MCP tools locally. Generated SQLite artifacts remain ignored by git until a later release decision includes the required data-license notice.

The meeAtif importer uses in-book references as canonical `hadith_number` values, such as `10:1`, rather than simple collection-wide numbers. SQLite-backed lookup also accepts collection-prefixed references such as `bukhari:10:1` and source references such as `https://sunnah.com/bukhari:603` or `bukhari:603` when the source row provides them. Use `validate_hadith_reference` for suggestions when an exact lookup misses.

## Future Product Direction

The Hadith MCP is intended to become one source layer for a broader Islamic source retrieval product that should live in a separate repository:

- Tafsir MCP handles Quran and tafsir retrieval.
- Hadith MCP handles Sunnah retrieval.
- A public web app can orchestrate both.
- An open-source/open-weight model can provide retrieval-grounded cited answers, using the MCPs as the source of truth.

## Current Status

This repository currently contains the project plan, source policy, v1 build plan, a TypeScript MCP server with fixture and SQLite-backed modes, and a local meeAtif import path for candidate SQLite builds.
