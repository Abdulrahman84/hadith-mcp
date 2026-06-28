# MCP Client Setup

Use this repository as a local MCP server while v1 data licensing remains a local-build posture.

## Build Local Data

```bash
npm install
npm run build
npm run build:meeatif-sqlite
```

The build writes:

- `data/generated/hadith-meeatif.sqlite`
- `data/generated/hadith-meeatif-import-report.json`
- `data/generated/hadith-meeatif-import-report.md`

The SQLite file is ignored by git. The report files summarize coverage, grades, and warnings for the local candidate build.

## Configure A Client

Copy one of these examples and replace `/absolute/path/to/hadith-mcp` with your local clone path:

- `apps/docs/examples/mcp-config/codex-local.json`
- `apps/docs/examples/mcp-config/claude-desktop.json`

Both examples run the built CLI directly with:

```bash
HADITH_MCP_DB_PATH=/absolute/path/to/hadith-mcp/data/generated/hadith-meeatif.sqlite \
node /absolute/path/to/hadith-mcp/packages/hadith-mcp/dist/cli.js
```

Without `HADITH_MCP_DB_PATH`, the server starts in fixture mode. Fixture mode is only for schema and client integration tests.

## Example Tool Calls

List available collections:

```json
{
  "name": "list_collections",
  "arguments": {}
}
```

Fetch by canonical in-book reference:

```json
{
  "name": "fetch_hadith",
  "arguments": {
    "collection": "bukhari",
    "hadith_number": "10:1",
    "language": "both"
  }
}
```

Fetch by source reference when present:

```json
{
  "name": "fetch_hadith",
  "arguments": {
    "collection": "bukhari",
    "hadith_number": "https://sunnah.com/bukhari:603"
  }
}
```

Search English text:

```json
{
  "name": "search_hadith",
  "arguments": {
    "query": "prayer",
    "language": "english",
    "limit": 5
  }
}
```

Validate a reference before fetching:

```json
{
  "name": "validate_hadith_reference",
  "arguments": {
    "collection": "sahih-al-bukhari",
    "hadith_number": "bukhari:603"
  }
}
```

## Safety Boundary

The MCP server is a cited retrieval layer. Client prompts should instruct assistants to:

- Cite returned `collection`, `hadith_number`, `source_dataset`, and `source_url_or_reference`.
- Preserve `grade: null` when no source-attributed grade is available.
- Avoid issuing fatwas or religious rulings.
- Avoid presenting generated interpretation as sourced hadith knowledge.
- Mention data limitations from `provenance_notes` when relevant.
