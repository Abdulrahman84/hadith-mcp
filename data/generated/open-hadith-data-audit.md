# Open-Hadith-Data Audit Report

Generated: 2026-06-28T11:47:40.520Z

Repository: https://github.com/mhashim6/Open-Hadith-Data

Ref: master

Commit: 1515f6cba21efed20d8916bf55acef1dffa0d2d5

## Summary

- Books expected: 6
- Books found with diacritized CSVs: 6
- Total plain rows inspected: 30845
- Total diacritized rows inspected: 30845
- English translations included: no
- Grades included: no
- Release blockers: 1
- Warnings: 2
- Can bundle v1 data: no

## Book Coverage

| Book | Plain CSV rows | Diacritized CSV rows | Counts match | Empty Arabic rows |
| --- | ---: | ---: | --- | ---: |
| Sahih al-Bukhari | 7008 | 7008 | yes | 0 |
| Sahih Muslim | 5362 | 5362 | yes | 0 |
| Sunan Abi Dawud | 4590 | 4590 | yes | 0 |
| Jami at-Tirmidhi | 3891 | 3891 | yes | 0 |
| Sunan an-Nasa'i | 5662 | 5662 | yes | 0 |
| Sunan Ibn Majah | 4332 | 4332 | yes | 0 |

## Release Blockers

- Source chain needs human review: Open-Hadith-Data says original CSV files came from hadith-islamware; hadith-islamware says data came from Islam Ware and lists Islam Ware copyright.

## Warnings

- Dataset is Arabic-only; English text would need a separate audited source.
- Dataset does not include source-attributed hadith grades; MCP grade responses must return grade null for this source.

## Notes

- This report intentionally does not store hadith text.
- The diacritized CSV is the preferred display source if this dataset is eventually cleared.
- The plain no-diacritics CSV can support search normalization.
- Grades must be returned as null for this source unless a separate audited grade source is added.
