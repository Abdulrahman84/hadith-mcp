# Future Quran/Hadith AI Product Plan

## Summary

The long-term product can be a cited Islamic source assistant, but it should live in a separate repository. V1 of this repository remains MCP-first and Hadith-only.

The separate product repository should orchestrate separate source systems:

- Tafsir MCP for Quran text, ayah validation, tafsir, and Quran search.
- Hadith MCP for Sunnah text, hadith references, grades, and hadith search.
- A pluggable model layer for retrieval-grounded synthesis.

The model must never be treated as the source of Quran or hadith text. It can only answer from retrieved, cited source records.

## Product Boundaries

### In Hadith MCP

- Exact hadith lookup.
- Arabic and English hadith search.
- Reference validation.
- Source-attributed grades.
- Provenance and dataset reporting.
- Read-only MCP tools for AI builders.

### Outside Hadith MCP

- Quran and tafsir retrieval.
- Cross-source answer synthesis.
- User accounts, saved conversations, and public web UI.
- Model provider selection.
- Fatwa workflows or scholarly adjudication.

## Future App Architecture

```text
web app / assistant UI
  -> retrieval orchestrator
      -> Tafsir MCP
      -> Hadith MCP
  -> model adapter
      -> local Ollama provider
      -> OpenAI-compatible hosted provider
      -> other provider plugins
```

The retrieval orchestrator must collect cited source records before the model receives a synthesis prompt. If no relevant cited sources are available, the assistant should say that it cannot answer from available sources.

## Model Layer

The default planning candidate is a Qwen3-family open-weight model because the family has strong multilingual positioning and Apache 2.0 open-weight releases. The exact model should be selected at product-build time, not locked by the Hadith MCP package.

Model requirements:

- Works with Arabic and English source records.
- Supports tool or function-style retrieval workflows.
- Can run locally through Ollama or a compatible runtime when possible.
- Can also run through hosted OpenAI-compatible inference.
- Must be prompt- and policy-constrained to synthesize only from retrieved citations.
- Must refuse uncited religious claims.

Candidate source:

- https://qwenlm.github.io/blog/qwen3/
- https://github.com/QwenLM/Qwen3

## Answer Policy

The product should:

- Quote or paraphrase only retrieved source records.
- Show citations for every Quran, tafsir, or hadith claim.
- Distinguish hadith text from grade metadata.
- Distinguish missing grade from source-attributed grade.
- Avoid hiding disagreement, missing provenance, or uncertainty.
- Avoid issuing fatwas or presenting generated interpretation as sourced knowledge.

The product should not:

- Quote Quran or hadith from model memory.
- Invent hadith references.
- Infer grades from collection names.
- Convert search results into rulings.
- Treat a model answer as scholarly authority.

## Product Acceptance Scenarios

- A user asks for hadith about an English or Arabic phrase, and the assistant returns cited Hadith MCP search results.
- A user asks about an ayah and a related hadith, and the product retrieves Quran/Tafsir from Tafsir MCP and Sunnah from Hadith MCP.
- A user asks for a religious ruling, and the assistant refuses to issue a fatwa while offering cited source retrieval.
- A user asks for a hadith grade, and the product shows only source-attributed grade metadata or explicitly says no attributed grade is available.
- A user asks an unsupported question, and the model declines to answer from memory.

## Repository Boundary

This repository should not grow into the final product app. It should only define and implement the Hadith MCP source layer.

The separate product repository can own:

- Web app and assistant UI.
- Cross-MCP orchestration.
- Model provider adapters.
- User-facing answer synthesis.
- Deployment and product operations.

This repository should own:

- Hadith MCP tool schemas.
- Hadith lookup and search behavior.
- Local SQLite data access.
- Data import and provenance validation.
- Developer docs for using this MCP from other clients.

## Relationship to V1

V1 should make the future product possible, but not implement it in this repository.

That means v1 should prioritize:

- Stable tool schemas.
- Structured citations.
- Provenance notes.
- Deterministic local data builds.
- Strict source boundaries.
- MCP client ergonomics.

It should defer:

- Web app design.
- Model adapter implementation.
- Cross-MCP orchestration.
- User-facing answer synthesis.
- Any fatwa-like workflow.
