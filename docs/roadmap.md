# Roadmap

## Milestone 1: Planning Repository

- Publish the project plan.
- Document source policy.
- Define planned MCP tools.
- Keep the first commit docs-only.

## Milestone 2: TypeScript MCP Scaffold

- Add monorepo workspace with `packages/hadith-mcp`, `packages/hadith-data`, and `apps/docs`.
- Add MCP server entrypoint.
- Add placeholder tools backed by fixtures.
- Add tests for tool schemas.
- Pin the MCP SDK line after checking the current upstream v1/v2 status.
- Verify a local MCP client can call the fixture-backed server.

## Milestone 3: Data Importer and SQLite

- Run a source audit spike before bundling any generated data.
- Import candidate Six Books dataset.
- Normalize references and metadata.
- Build SQLite with FTS5 indexes.
- Generate a data quality report.
- Keep dataset license/provenance notes separate from the MIT code license.

## Milestone 4: Verified MCP MVP

- Implement exact lookup.
- Implement Arabic and English search.
- Implement reference validation.
- Implement source-attributed grade lookup.
- Add MCP client examples.

## Milestone 5: Future Product

- Document how a separate product repository can integrate Hadith MCP alongside Tafsir MCP.
- Specify how Hadith MCP results can support a unified source search interface.
- Keep the pluggable open-source/open-weight model layer out of this repository.
- Treat Qwen3-family models as an initial planning candidate, with the exact model selected later.
- Document the requirement for retrieval-grounded cited answers in the separate product.
- Keep Quran/Tafsir and Hadith source responsibilities separate.
