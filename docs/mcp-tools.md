# MCP Tools

The implementation registers all six v1 tools. By default the server uses synthetic fixture data for schema and MCP client integration tests; when `HADITH_MCP_DB_PATH` is set, it reads from the configured SQLite database.

## `list_collections`

Returns available collections and metadata.

Expected fields:

- `collection`
- `display_name`
- `language_coverage`
- `hadith_count`
- `source_dataset`

## `fetch_hadith`

Fetches one hadith by collection and reference, returning a cited source record or a structured `hadith_not_found` error.

Inputs:

- `collection`
- `hadith_number`: accepts canonical in-book references such as `10:1`, collection-prefixed references such as `bukhari:10:1`, and source references such as `https://sunnah.com/bukhari:603` when present in the SQLite source row
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

Returns snippets plus provenance notes. It does not return generated explanations.

Inputs:

- `query`
- `collection` optional
- `language` optional
- `limit` optional
- `offset` optional

Returns ranked source records with snippets and references. It must not return generated explanations.

## `validate_hadith_reference`

Checks whether a collection and hadith number exist.

Returns suggestions for unknown references when possible. SQLite-backed mode returns canonical `hadith_number` values after resolving source references.

Inputs:

- `collection`
- `hadith_number`

Returns a structured valid/invalid result with suggestions when possible.

## `get_hadith_metadata`

Returns non-text metadata for a hadith, including numbering, source dataset, import version, and provenance notes.

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

If no attributed grade exists in the configured data, the tool returns `grade: null` with provenance notes.

Inputs:

- `collection`
- `hadith_number`

If no attributed grade is available, the tool must return `grade: null` and explain the missing attribution in `provenance_notes`.
