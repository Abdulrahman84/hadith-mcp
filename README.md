# hadith-mcp

`hadith-mcp` is a planned Model Context Protocol server for retrieving hadith text and metadata from auditable sources.

The project goal is to give AI assistants and developer tools a strict source layer for the Sunnah: exact references, Arabic text, available English translations, source-attributed grading, and clear provenance. The MCP server should retrieve and cite source material; it should not act as a mufti or generate unsupported religious claims.

## V1 Direction

- TypeScript MCP server distributed as a local npm package.
- Read-only SQLite database with FTS5 search.
- Initial target scope: the Six Books.
- Arabic text required for imported hadith.
- English text included when the selected source provides it.
- Grades exposed only when they are source-attributed.
- No model-generated explanation or interpretation returned by MCP tools.

## Planned Tools

- `list_collections`
- `fetch_hadith`
- `search_hadith`
- `validate_hadith_reference`
- `get_hadith_metadata`
- `get_hadith_grade`

See [docs/mcp-tools.md](docs/mcp-tools.md) for the planned interface.

## Future Product Direction

The Hadith MCP is intended to become one half of a broader Islamic source retrieval product:

- Tafsir MCP handles Quran and tafsir retrieval.
- Hadith MCP handles Sunnah retrieval.
- A public web app can orchestrate both.
- An open-source/open-weight model can provide retrieval-grounded cited answers, using the MCPs as the source of truth.

## Current Status

This repository currently contains the project plan and source policy. Implementation has not started yet.

