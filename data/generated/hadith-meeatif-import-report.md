# meeAtif Import Report

Generated: 2026-06-28T14:36:59.867Z

Dataset: meeAtif/hadith_datasets

Version: cd62605e4fef3c46968a5f9fdcccbbbffdf631b5

URL: https://huggingface.co/datasets/meeAtif/hadith_datasets

License note: Hugging Face metadata declares MIT; project owner accepted source-chain risk for local v1 candidate build.

## Rows

Imported rows: 33736

Skipped rows: 2

| Key | Count |
| --- | ---: |
| abu_dawud | 5276 |
| bukhari | 7277 |
| ibn_majah | 4079 |
| muslim | 7368 |
| nasai | 5683 |
| tirmidhi | 4053 |

## Text Coverage

Arabic rows: 33736

English rows: 33735

Missing English rows: 1

| Key | Count |
| --- | ---: |
| muslim | 1 |

## Grade Coverage

Graded rows: 18054

Ungraded rows: 15682

### Graded By Collection

| Key | Count |
| --- | ---: |
| abu_dawud | 4896 |
| ibn_majah | 3933 |
| nasai | 5320 |
| tirmidhi | 3905 |

### Ungraded By Collection

| Key | Count |
| --- | ---: |
| abu_dawud | 380 |
| bukhari | 7277 |
| ibn_majah | 146 |
| muslim | 7368 |
| nasai | 363 |
| tirmidhi | 148 |

### Grade Sources

| Key | Count |
| --- | ---: |
| Al-Albani | 4898 |
| Darussalam | 13156 |

## Import Warnings

Total warnings: 15685

| Key | Count |
| --- | ---: |
| missing_english | 1 |
| missing_grade | 15682 |
| unparseable_reference | 2 |

### Warning Samples

- missing_english / muslim / https://sunnah.com/muslim:2525a: English text is missing; row will be imported with english_text null.
- missing_grade / bukhari / https://sunnah.com/bukhari:1: No source-attributed grade is present; MCP should return grade null.
- unparseable_reference / nasai / https://sunnah.com/nasai:: Could not parse Sunnah.com reference.
- missing_grade / bukhari / https://sunnah.com/bukhari:2: No source-attributed grade is present; MCP should return grade null.
- missing_grade / bukhari / https://sunnah.com/bukhari:3: No source-attributed grade is present; MCP should return grade null.
- missing_grade / bukhari / https://sunnah.com/bukhari:4: No source-attributed grade is present; MCP should return grade null.
- missing_grade / bukhari / https://sunnah.com/bukhari:5: No source-attributed grade is present; MCP should return grade null.
- missing_grade / bukhari / https://sunnah.com/bukhari:6: No source-attributed grade is present; MCP should return grade null.
- missing_grade / bukhari / https://sunnah.com/bukhari:7: No source-attributed grade is present; MCP should return grade null.
- missing_grade / bukhari / https://sunnah.com/bukhari:8: No source-attributed grade is present; MCP should return grade null.

## SQLite Validation

Total warnings: 0

Release blockers: 0

No SQLite validation warnings.

### Validation Warning Samples

None.

## Release Notes

- This report describes a local v1 candidate import, not a cleared bundled data release.
- Generated SQLite artifacts remain ignored by git until a later release decision includes the required data-license notice.
- Grades are source-attributed only; missing grades must be returned as grade null.
