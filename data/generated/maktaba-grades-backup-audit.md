# Maktaba Grades Backup Audit Report

Generated: 2026-06-28T11:59:49.848Z

Repository: https://github.com/fawazahmed0/maktaba-grades-backup

Ref: main

Commit: 71bfc86b1d9e96beb3e3d3f58a16a681ee5c630d

## Summary

- Grade source books: 11
- Collections covered: abudawud, ibnmajah, nasai, tirmidhi
- Graders: Abu Ghuddah, Ahmad Muhammad Shakir, Al-Albani, Bashar Awad Maarouf, Muhammad Fouad Abd al-Baqi, Muhammad Muhyi Al-Din Abdul Hamid, Shuaib Al Arnaut
- Total per-page HTML files: 58498
- Release blockers: 3
- Warnings: 0
- Can bundle v1 data: no

## Grade Sources

| Book ID | Collection | Grader | Page files | Source URL |
| --- | --- | --- | ---: | --- |
| 1755 | abudawud | Al-Albani | 5272 | https://al-maktaba.org/book/1755 |
| 32832 | abudawud | Shuaib Al Arnaut | 1272 | https://al-maktaba.org/book/32832 |
| 33759 | abudawud | Muhammad Muhyi Al-Din Abdul Hamid | 7206 | https://al-maktaba.org/book/33759 |
| 783 | nasai | Al-Albani | 5758 | https://al-maktaba.org/book/783 |
| 33865 | nasai | Abu Ghuddah | 8333 | https://al-maktaba.org/book/33865 |
| 782 | tirmidhi | Al-Albani | 3956 | https://al-maktaba.org/book/782 |
| 33754 | tirmidhi | Ahmad Muhammad Shakir | 6463 | https://al-maktaba.org/book/33754 |
| 33861 | tirmidhi | Bashar Awad Maarouf | 6943 | https://al-maktaba.org/book/33861 |
| 810 | ibnmajah | Al-Albani | 4349 | https://al-maktaba.org/book/810 |
| 1198 | ibnmajah | Muhammad Fouad Abd al-Baqi | 5921 | https://al-maktaba.org/book/1198 |
| 33036 | ibnmajah | Shuaib Al Arnaut | 3025 | https://al-maktaba.org/book/33036 |

## Release Blockers

- Repository license was not found; bundled redistribution of copied Shamela/al-Maktaba pages is not cleared.
- Grade extraction is not implemented yet; HTML pages must be parsed and mapped to canonical hadith references before use.
- Coverage excludes Sahih al-Bukhari and Sahih Muslim grade sources.

## Warnings

- None

## Notes

- This report intentionally does not store hadith or grade page text.
- This source is best treated as a grade provenance candidate until license and parser work are complete.
- Bukhari and Muslim should continue returning grade null unless another audited grade source is added.
