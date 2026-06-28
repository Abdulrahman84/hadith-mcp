# Hadith API Audit Report

Generated: 2026-06-28T11:26:07.355Z

Repository: https://github.com/fawazahmed0/hadith-api

Ref: 1

Commit: df57907be35291c91ad6a6691180e22ca9920784

## Summary

- Books expected: 6
- Books found with Arabic editions: 6
- Total Arabic hadith records inspected: 34532
- Total English hadith records inspected: 34532
- Release blockers: 19
- Warnings: 6
- Can bundle v1 data: no

## Book Coverage

| Book | Arabic edition | Arabic count | English edition | English count | Counts match | Grade sources |
| --- | --- | ---: | --- | ---: | --- | --- |
| Sahih al-Bukhari | ara-bukhari | 7589 | eng-bukhari | 7589 | yes | none |
| Sahih Muslim | ara-muslim | 7563 | eng-muslim | 7563 | yes | none |
| Sunan Abi Dawud | ara-abudawud | 5274 | eng-abudawud | 5274 | yes | Al-Albani, Muhammad Muhyi Al-Din Abdul Hamid, Shuaib Al Arnaut, Zubair Ali Zai |
| Jami at-Tirmidhi | ara-tirmidhi | 3998 | eng-tirmidhi | 3998 | yes | Ahmad Muhammad Shakir, Al-Albani, Bashar Awad Maarouf, Zubair Ali Zai |
| Sunan an-Nasa'i | ara-nasai | 5765 | eng-nasai | 5765 | yes | Abu Ghuddah, Al-Albani, Zubair Ali Zai |
| Sunan Ibn Majah | ara-ibnmajah | 4343 | eng-ibnmajah | 4343 | yes | Al-Albani, Muhammad Fouad Abd al-Baqi, Shuaib Al Arnaut, Zubair Ali Zai |

## Release Blockers

- Upstream References.md lists broad source references, but the inspected edition metadata does not provide record-level provenance.
- bukhari: Arabic edition ara-bukhari has no edition-level source field.
- bukhari: Arabic edition ara-bukhari has 9 records with missing text.
- bukhari: English edition eng-bukhari has no edition-level source field.
- muslim: Arabic edition ara-muslim has no edition-level source field.
- muslim: Arabic edition ara-muslim has 203 records with missing text.
- muslim: English edition eng-muslim has no edition-level source field.
- abudawud: Arabic edition ara-abudawud has no edition-level source field.
- abudawud: Arabic edition ara-abudawud has 2 records with missing text.
- abudawud: English edition eng-abudawud has no edition-level source field.
- tirmidhi: Arabic edition ara-tirmidhi has no edition-level source field.
- tirmidhi: Arabic edition ara-tirmidhi has 74 records with missing text.
- tirmidhi: English edition eng-tirmidhi has no edition-level source field.
- nasai: Arabic edition ara-nasai has no edition-level source field.
- nasai: Arabic edition ara-nasai has 86 records with missing text.
- nasai: English edition eng-nasai has no edition-level source field.
- ibnmajah: Arabic edition ara-ibnmajah has no edition-level source field.
- ibnmajah: Arabic edition ara-ibnmajah has 5 records with missing text.
- ibnmajah: English edition eng-ibnmajah has no edition-level source field.

## Warnings

- bukhari: English edition eng-bukhari has 9 records with missing text.
- muslim: English edition eng-muslim has 203 records with missing text.
- abudawud: English edition eng-abudawud has 2 records with missing text.
- tirmidhi: English edition eng-tirmidhi has 72 records with missing text.
- nasai: English edition eng-nasai has 86 records with missing text.
- ibnmajah: English edition eng-ibnmajah has 3 records with missing text.

## Notes

- This report intentionally does not store hadith text.
- Repository-level licensing is not treated as sufficient record-level provenance.
- Grades may be usable only when the grade source/name and grade value are present and provenance is accepted.
