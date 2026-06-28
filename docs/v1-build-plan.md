# V1 Build Plan

## Objective

Ship a local-first TypeScript MCP server that lets AI builders retrieve hadith text and metadata with strict citations, auditable provenance, and no generated religious interpretation.

V1 is successful when a developer can install the package locally, point an MCP client at it, and use the exposed tools to look up and search Six Books hadith records from a verified SQLite artifact.

## Non-Goals

- No public web app in v1.
- No final Quran/Hadith AI product app in this repository.
- No Quran or tafsir retrieval in this repository.
- No fatwa, fiqh ruling, or generated religious interpretation tools.
- No hadith text returned without source provenance.
- No bundled dataset whose license or redistribution posture is unclear.
- No model-generated grades or collection-level grade assumptions.

## Current External Inputs

- MCP TypeScript SDK: the official SDK is in a v2 transition as of 2026-06-28. The upstream README says v2 is pre-alpha and v1.x remains recommended for production use until the stable v2 release. The scaffold task must pin an explicit SDK line after checking the current release state.
- Candidate data source: `fawazahmed0/hadith-api` is public, includes multiple languages and grades, and is released under the Unlicense at the repository level. Its own `References.md` points to multiple upstream sources, so v1 must audit text provenance and redistribution risk before bundling any generated SQLite data.
- Open source concern: an open issue asks about the source and license of the Arabic texts. This is a release blocker unless answered by documentation, upstream clarification, or a narrower data posture.
- Sunnah.com: useful as a reference and possible future integration, but not a v1 bundled data dependency. Its developer page says API access needs an API key, covers a portion of data, and offline dumps are not available yet.
- Dorar: useful as a future enrichment or live integration candidate. Its public API page describes JSON/JSONP search access, but v1 must not bundle Dorar content unless terms explicitly allow the intended redistribution and packaging.

Reference links:

- https://github.com/modelcontextprotocol/typescript-sdk
- https://github.com/fawazahmed0/hadith-api
- https://github.com/fawazahmed0/hadith-api/blob/1/References.md
- https://github.com/fawazahmed0/hadith-api/issues/129
- https://sunnah.com/developers
- https://dorar.net/article/389/%D8%AE%D8%AF%D9%85%D8%A9-%D9%88%D8%A7%D8%AC%D9%87%D8%A9-%D8%A7%D9%84%D9%85%D9%88%D8%B3%D9%88%D8%B9%D8%A9-%D8%A7%D9%84%D8%AD%D8%AF%D9%8A%D8%AB%D9%8A%D8%A9-API

## Architecture Decisions

### Package Shape

- Runtime: Node.js with TypeScript.
- Repository: greenfield TypeScript monorepo.
- Distribution: local npm package from `packages/hadith-mcp` with a `bin` entry for MCP clients.
- Transport: stdio for v1.
- Data access: read-only SQLite.
- Search: SQLite FTS5, with Arabic and English indexed separately.
- Validation: schema validation for every MCP tool input and every importer output row.
- Outputs: structured JSON payloads inside MCP tool results, optimized for downstream AI clients to cite.

### Repository Layout

Planned layout once implementation starts:

```text
packages/
  hadith-mcp/
    src/
      cli.ts
      server.ts
      tools/
      db/
      schemas/
      provenance/
    test/
      unit/
      integration/
  hadith-data/
    src/
      importers/
      normalize/
      validate/
      sqlite/
      reports/
    test/
      unit/
      integration/
apps/
  docs/
    examples/
    mcp-config/
data/
  fixtures/
  generated/
docs/
  architecture.md
  data-policy.md
  mcp-tools.md
  roadmap.md
  future-product-plan.md
  v1-build-plan.md
```

Package responsibilities:

- `packages/hadith-mcp`: read-only MCP server, public tool schemas, SQLite query layer, and npm `bin`.
- `packages/hadith-data`: source importers, normalization, validation, deterministic SQLite builder, and data QA reports.
- `apps/docs`: developer docs, MCP client configuration examples, and safe AI usage examples.

### SQLite Model

The first schema should separate stable hadith identity from language text, source import metadata, and grades:

- `collections`: canonical collection ids, display names, source edition ids, language coverage.
- `books`: collection-local book metadata.
- `chapters`: collection-local chapter or section metadata.
- `hadiths`: canonical collection plus hadith number and normalized references.
- `hadith_texts`: one row per hadith per language, with source edition and import hash.
- `hadith_grades`: grade text, grader/source attribution, confidence policy, and provenance note.
- `source_datasets`: dataset name, version, URL, license note, import timestamp, and content hash.
- `import_warnings`: missing fields, duplicate references, license concerns, unmapped grades, and normalization warnings.

V1 can add columns during import discovery, but it should preserve this separation so the MCP tools can return `grade: null` independently from Arabic and English text.

## Workstreams

### 1. TypeScript MCP Scaffold

Tasks:

- Choose package manager and Node version.
- Create monorepo workspace layout with `packages/hadith-mcp`, `packages/hadith-data`, and `apps/docs`.
- Select and pin MCP SDK generation after checking upstream release status.
- Add TypeScript config, linting, formatting, test runner, and build scripts.
- Add `bin` entrypoint that starts a stdio MCP server.
- Register all planned tools with fixture-backed responses.
- Add schema tests for every tool input and output.

Acceptance criteria:

- `npm test` passes.
- `npm run build` emits a runnable CLI.
- A local MCP client can list and call fixture-backed tools.
- No real hadith data is bundled yet except tiny test fixtures with explicit provenance notes.
- Package boundaries are clear: MCP serving logic does not contain importer logic.

Status: implemented with synthetic fixture records and an in-memory MCP client smoke test.

### 2. Data Audit Spike

Tasks:

- Download or read candidate `hadith-api` metadata, editions, and Six Books Arabic/English files.
- Produce a local audit report covering coverage, source URLs, license notes, missing fields, duplicate hadith numbers, language alignment, and grade attribution.
- Decide whether v1 can bundle generated SQLite, require user-local build, or ship only importer tooling until provenance is resolved.
- Document every source-level concern in `docs/data-policy.md`.
- Keep Sunnah.com and Dorar out of bundled v1 data unless a later written policy review explicitly clears them.

Acceptance criteria:

- A generated data report exists and is reproducible.
- Six Books coverage is measured by collection and language.
- Every grade is classified as attributed, unattributed, or rejected.
- Any unresolved text-license issue is visible as a release blocker.

Status: audit tooling is implemented for `fawazahmed0/hadith-api`. The first generated report confirms Six Books Arabic and English coverage, but marks bundled v1 data as blocked due to missing edition-level source fields, missing record-level provenance, and missing Arabic text in some records.

Status: audit tooling is also implemented for `Open-Hadith-Data`. The generated report shows complete Six Books Arabic coverage with no empty Arabic rows. It remains blocked only by source-chain review; Arabic-only text and missing grades are documented limitations rather than blockers.

### 3. Importer and SQLite Builder

Tasks:

- Build importer from audited JSON into a normalized intermediate format.
- Validate required Arabic text.
- Align English translations when available.
- Normalize collection ids and hadith numbers.
- Store source dataset metadata and content hashes.
- Build SQLite tables and FTS5 indexes.
- Write import warnings for non-fatal issues.
- Build and test SQLite first from synthetic fixture rows while real source data remains audit-blocked.

Acceptance criteria:

- SQLite build is deterministic from pinned source inputs.
- Import fails on missing Arabic text for included records.
- Import does not invent grade attribution.
- Data quality report is generated on every build.
- Tests cover representative good rows, missing Arabic, missing English, duplicate references, and unattributed grades.

### 4. Real Tool Implementation

Tasks:

- Replace fixtures with SQLite-backed query services.
- Implement exact lookup for `fetch_hadith`.
- Implement `list_collections`.
- Implement FTS search for Arabic and English.
- Implement reference validation with suggestions.
- Implement metadata and grade lookup.
- Add stable error shapes for invalid inputs, missing records, and unavailable data.

Acceptance criteria:

- Every returned hadith text includes source dataset and reference.
- `get_hadith_grade` returns `grade: null` when attribution is unavailable.
- Search returns snippets and citations, not explanations.
- Invalid references produce structured suggestions when possible.
- Integration tests run against a small fixture SQLite database.

### 5. Developer Experience and Release

Tasks:

- Add MCP client configuration examples.
- Include Claude Desktop and Codex-style MCP configuration examples.
- Add README install and local usage instructions.
- Add release checklist.
- Add dataset license notice template separate from the MIT code license.
- Add npm package metadata.
- Tag a pre-release only after data provenance blockers are resolved or explicitly scoped out.
- Document integration guidance for a separate future product repository without adding product app code here.

Acceptance criteria:

- A developer can install locally and run the MCP server from the README.
- The package clearly distinguishes code license from dataset license/provenance.
- The release notes list included collections, languages, data source version, and known limitations.

## Release Gates

V1 must not be released with bundled data unless all of these are true:

- Arabic text exists for every included hadith.
- Every returned text has source dataset metadata.
- Dataset license and redistribution posture are documented.
- Grade attribution is preserved, or the response returns `grade: null`.
- The data report is committed or attached to the release.
- MCP tools do not generate interpretation, legal rulings, or devotional claims.
- Tests pass for schemas, importer validation, SQLite queries, and MCP tool calls.

## First Implementation Sprint

Recommended first sprint, in order:

1. Add TypeScript package scaffold with fixture-backed MCP tools.
2. Add schema tests for the six planned tools.
3. Add a tiny fixture database or fixture JSON with clearly fake/non-release provenance.
4. Add a data audit script that reads candidate source metadata and produces a markdown or JSON report.
5. Update `docs/data-policy.md` with the audit findings and release blockers.

This keeps the project useful to AI builders early while protecting the source policy from being diluted by convenience.
