# Generated Data

Generated SQLite artifacts and import reports belong here during local development.

The repository ignores generated database files. Release artifacts must include a separate data license/provenance notice.

Run `npm run build:fixture-sqlite` to create `hadith-fixture.sqlite` from synthetic fixture rows.

Run `npm run build:meeatif-sqlite` to create `hadith-meeatif.sqlite` from the accepted candidate source. This generated database is ignored by git.

The same command writes `hadith-meeatif-import-report.json` and `hadith-meeatif-import-report.md`. These reports summarize row counts, text coverage, grade coverage, import warnings, and SQLite validation warnings for the local candidate build.
