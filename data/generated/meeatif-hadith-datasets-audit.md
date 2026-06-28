# meeAtif Hadith Dataset Audit Report

Generated: 2026-06-28T14:11:51.250Z

Repository: https://huggingface.co/datasets/meeAtif/hadith_datasets

Ref: main

Commit: cd62605e4fef3c46968a5f9fdcccbbbffdf631b5

## Summary

- Books expected: 6
- Books found: 6
- Total rows inspected: 33738
- Missing Arabic rows: 0
- Missing English rows: 1
- Missing grade rows: 15682
- Sunnah.com references: 33738
- Grade sources: Al-Albani, Darussalam
- Release blockers: 2
- Warnings: 7
- Can bundle v1 data: no

## Book Coverage

| Book | Rows | Missing Arabic | Missing English | Missing Grades | Grade sources |
| --- | ---: | ---: | ---: | ---: | --- |
| Sahih al-Bukhari | 7277 | 0 | 0 | 7277 | none |
| Sahih Muslim | 7368 | 0 | 1 | 7368 | none |
| Sunan Abi Dawud | 5276 | 0 | 0 | 380 | Al-Albani |
| Jami at-Tirmidhi | 4053 | 0 | 0 | 148 | Al-Albani, Darussalam |
| Sunan an-Nasa'i | 5685 | 0 | 0 | 363 | Darussalam |
| Sunan Ibn Majah | 4079 | 0 | 0 | 146 | Al-Albani, Darussalam |

## Release Blockers

- Source chain needs human review: README describes direct sunnah.com links, and text/translation redistribution rights are not established by the Hugging Face MIT metadata alone.
- Grade source rights need human review: grades include named sources such as Darussalam or Al-Albani, but redistribution terms for those grade attributions are not documented in the dataset.

## Warnings

- bukhari: 7277 rows have no grade; MCP must return grade null for those records.
- muslim: 1 rows are missing English text.
- muslim: 7368 rows have no grade; MCP must return grade null for those records.
- abudawud: 380 rows have no grade; MCP must return grade null for those records.
- tirmidhi: 148 rows have no grade; MCP must return grade null for those records.
- nasai: 363 rows have no grade; MCP must return grade null for those records.
- ibnmajah: 146 rows have no grade; MCP must return grade null for those records.

## Notes

- This report intentionally does not store hadith text.
- Empty grade fields are acceptable only if MCP responses return grade null with provenance notes.
- Source links pointing to Sunnah.com do not by themselves establish redistribution rights.
