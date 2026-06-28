# MCP Tools

The current implementation registers all six v1 tools with synthetic fixture data. Fixture records exist only to test schemas and MCP client integration; they are not real hadith text.

## `list_collections`

Returns available fixture collections and metadata.

Expected fields:

- `collection`
- `display_name`
- `language_coverage`
- `hadith_count`
- `source_dataset`

## `fetch_hadith`

Fetches one hadith by collection and number.

Current scaffold behavior: returns a synthetic fixture record or a structured `hadith_not_found` error.

Inputs:

- `collection`
- `hadith_number`
- `language` optional, default `both`

Response must include:

- `collection`
- `book`
- `chapter`
- `hadith_number`
- `arabic_text`
- `english_text`
- `grade`
- `source_dataset`
- `source_url_or_reference`
- `provenance_notes`

## `search_hadith`

Searches Arabic and/or English hadith text.

Current scaffold behavior: searches synthetic fixture records and returns snippets plus provenance notes.

Inputs:

- `query`
- `collection` optional
- `language` optional
- `limit` optional
- `offset` optional

Returns ranked source records with snippets and references. It must not return generated explanations.

## `validate_hadith_reference`

Checks whether a collection and hadith number exist.

Current scaffold behavior: validates against the fixture records and returns suggestions for unknown references.

Inputs:

- `collection`
- `hadith_number`

Returns a structured valid/invalid result with suggestions when possible.

## `get_hadith_metadata`

Returns non-text metadata for a hadith.

Current scaffold behavior: returns fixture metadata, numbering, source dataset, import version, and provenance notes.

Inputs:

- `collection`
- `hadith_number`

Expected metadata:

- book and chapter
- numbering details
- source dataset
- import version
- provenance notes

## `get_hadith_grade`

Returns source-attributed grade metadata when available.

Current scaffold behavior: most fixture records return `grade: null`; one synthetic fixture record returns a source-attributed test grade to verify the plumbing.

Inputs:

- `collection`
- `hadith_number`

If no attributed grade is available, the tool must return `grade: null` and explain the missing attribution in `provenance_notes`.
