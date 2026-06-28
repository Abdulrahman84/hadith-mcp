# Architecture

## Goal

Build a local-first Hadith MCP that AI builders can install and run without depending on a hosted service or API key.

## V1 Components

### Monorepo Packages

- `packages/hadith-mcp`: local MCP server distributed through npm.
- `packages/hadith-data`: import, normalize, validate, and build the SQLite database.
- `apps/docs`: developer documentation and MCP client examples.

### MCP Server

- Implemented in TypeScript.
- Runs locally through stdio for MCP clients.
- Exposes read-only tools for lookup, search, validation, and metadata.
- Never generates religious interpretation.

### Data Package

- Builds a normalized SQLite database from auditable source datasets.
- Uses FTS5 for Arabic and English text search.
- Tracks provenance for every imported record.
- Rejects or flags unsupported grading metadata.

### Documentation

- Provides MCP client configuration examples.
- Documents data-source policy and limitations.
- Shows safe AI usage patterns with citations.

## Data Flow

1. Import source datasets into a normalized intermediate format.
2. Validate references, required Arabic text, source provenance, and grade attribution.
3. Build a versioned SQLite artifact.
4. Package or download the SQLite artifact with the MCP server.
5. MCP tools query SQLite and return structured source records.

## Future Product Architecture

The later public product should live in a separate repository and keep Quran/Tafsir and Hadith responsibilities separate:

- Tafsir MCP remains responsible for Quran text, tafsir, ayah validation, and Quran search.
- Hadith MCP remains responsible for hadith text, references, grades, and hadith search.
- A separate web app or assistant repository orchestrates both MCPs.
- A pluggable open-source/open-weight model adapter can support local Ollama and hosted OpenAI-compatible inference.
- Qwen3-family open-weight models are an initial planning candidate for the future model layer, but the exact model should be selected at product-build time.

The model layer must be retrieval-grounded. It can explain retrieved sources with citations, but it must not quote Quran or hadith from memory.
