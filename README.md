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

## Implemented Fixture Tools

- `list_collections`
- `fetch_hadith`
- `search_hadith`
- `validate_hadith_reference`
- `get_hadith_metadata`
- `get_hadith_grade`

See [docs/mcp-tools.md](docs/mcp-tools.md) for the planned interface.

See [docs/v1-build-plan.md](docs/v1-build-plan.md) for the implementation plan, release gates, and first sprint.

See [docs/future-product-plan.md](docs/future-product-plan.md) for how this MCP should support a later Quran/Hadith AI product in a separate repository.

## Local Development

```bash
npm install
npm run typecheck
npm test
npm run build
npm run audit:hadith-api
npm run audit:meeatif-hadith-datasets
npm run audit:maktaba-grades-backup
npm run audit:open-hadith-data
npm run build:fixture-sqlite
npm run build:meeatif-sqlite
node packages/hadith-mcp/dist/cli.js
```

The current MCP server is fixture-backed. The fixture records are synthetic placeholders for testing schemas and client integration; they are not real hadith text and must not be used for religious claims.

The audit commands write candidate-source reports to `data/generated/`. `hadith-api` is blocked by missing provenance and missing Arabic text. `Open-Hadith-Data` is the stronger Arabic candidate, but still needs source-chain review before bundled release.

The fixture SQLite command writes a synthetic non-release database to `data/generated/hadith-fixture.sqlite`.

The meeAtif SQLite command writes a local candidate database to `data/generated/hadith-meeatif.sqlite` after the project owner accepted the source-chain risk for local v1 import work.

## Future Product Direction

The Hadith MCP is intended to become one source layer for a broader Islamic source retrieval product that should live in a separate repository:

- Tafsir MCP handles Quran and tafsir retrieval.
- Hadith MCP handles Sunnah retrieval.
- A public web app can orchestrate both.
- An open-source/open-weight model can provide retrieval-grounded cited answers, using the MCPs as the source of truth.

## Current Status

This repository currently contains the project plan, source policy, v1 build plan, and a fixture-backed TypeScript MCP scaffold. Real hadith data import has not started yet.
