# Data Policy

## Principles

- Prefer auditable, redistributable datasets.
- Preserve source references and provenance.
- Require Arabic text for every imported hadith.
- Include English translation only when the source provides it.
- Expose grades only when attribution is available.
- Treat dataset licenses separately from the code license.

## V1 Source Posture

The initial candidate source is `fawazahmed0/hadith-api` because it is publicly available, permissively licensed, and includes hadith JSON data in multiple languages and grades. Before release, the importer must produce a data report that confirms coverage, provenance, missing fields, duplicate references, and grade attribution.

Current audit status: `npm run audit:hadith-api` inspects the Six Books Arabic and English editions and writes reports to `data/generated/hadith-api-audit.json` and `data/generated/hadith-api-audit.md`. The first audit found Six Books Arabic and English coverage, but `can_bundle_v1_data` is `false` because edition-level source fields are blank, record-level provenance is not available from the inspected metadata, and some Arabic records have missing text.

Until those blockers are resolved, v1 may keep the importer tooling and fixture-backed MCP scaffold, but it must not publish a bundled SQLite artifact from this source as authoritative hadith data.

`Open-Hadith-Data` is the stronger Arabic source candidate after audit. `npm run audit:open-hadith-data` inspects the Six Books plain and diacritized CSVs and writes reports to `data/generated/open-hadith-data-audit.json` and `data/generated/open-hadith-data-audit.md`. The audit found complete Six Books Arabic coverage with matching plain/diacritized counts and no empty Arabic rows. It is Arabic-only and has no grades, which are acceptable limitations if documented and exposed as `english_text: null` and `grade: null`.

Current Open-Hadith-Data blocker: source-chain review. Its README says the original CSV files came from `ceefour/hadith-islamware`, and that upstream README says the data came from Islam Ware and lists Islam Ware copyright. Do not publish a bundled SQLite artifact from Open-Hadith-Data until that source chain is cleared or explicitly accepted under the documented data license posture.

Sunnah.com and Dorar are important references, but they should not be bundled in v1 unless their terms explicitly allow the intended usage.

Sunnah.com is not a v1 bundled data dependency because its developer page says API access requires an API key, currently covers only a portion of its data, and offline dumps are not available yet.

Dorar is a future enrichment or live integration candidate. Its public page documents JSON/JSONP search access for displaying search results, but v1 must not redistribute or package Dorar content unless a terms review explicitly clears that use.

## Grading Policy

Grades must be returned only when the imported source explicitly provides enough attribution to show where the grade came from. If attribution is missing, the MCP response must return `grade: null` and include a provenance note.

Collection-level assumptions should not be silently converted into hadith-level grades.

## Religious Boundary

This project is a retrieval and citation layer. It must not:

- Issue fatwas.
- Present generated interpretation as sourced knowledge.
- Hide disagreement or missing provenance.
- Return uncited hadith text.
