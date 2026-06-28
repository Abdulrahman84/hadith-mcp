# Data Policy

## Principles

- Prefer auditable, redistributable datasets.
- Preserve source references and provenance.
- Require Arabic text for every imported hadith.
- Include English translation only when the source provides it.
- Expose grades only when attribution is available.
- Treat dataset licenses separately from the code license.

## V1 Source Posture

The v1 candidate source is `meeAtif/hadith_datasets`. It was selected because it provides Six Books coverage with Arabic text, English text where available, and source-attributed grades in the inspected data.

`npm run audit:meeatif-hadith-datasets` writes the active candidate-source reports to `data/generated/meeatif-hadith-datasets-audit.json` and `data/generated/meeatif-hadith-datasets-audit.md`. The audit found Six Books coverage, no missing Arabic rows, one missing English row, and grade sources including Al-Albani and Darussalam.

Project decision: proceed with `meeAtif/hadith_datasets` as a local v1 candidate import after owner acceptance of the source-chain risk. This does not represent independent legal clearance for third-party redistribution. Generated SQLite artifacts from this source remain ignored by git unless a later release decision explicitly includes the required data-license notice.

The meeAtif importer uses the dataset's `In-book reference` as the canonical local `hadith_number` to avoid collapsing records where Sunnah.com URL suffixes repeat. The original Sunnah.com URL remains stored in `source_url_or_reference`. Rows with unparseable source references are skipped and must be reported by the import command.

Sunnah.com and Dorar are not direct v1 bundled data dependencies. Do not redistribute or package their content unless a terms review explicitly clears that use.

## Grading Policy

Grades must be returned only when the imported source explicitly provides enough attribution to show where the grade came from. If attribution is missing, the MCP response must return `grade: null` and include a provenance note.

Collection-level assumptions should not be silently converted into hadith-level grades.

## Religious Boundary

This project is a retrieval and citation layer. It must not:

- Issue fatwas.
- Present generated interpretation as sourced knowledge.
- Hide disagreement or missing provenance.
- Return uncited hadith text.
