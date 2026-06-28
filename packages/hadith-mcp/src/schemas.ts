import * as z from "zod/v4";

export const languageSchema = z.enum(["arabic", "english", "both"]);

export const collectionSummarySchema = z.object({
  collection: z.string(),
  display_name: z.string(),
  language_coverage: z.array(z.string()),
  hadith_count: z.number().int().nonnegative(),
  source_dataset: z.string()
});

export const gradeSchema = z.object({
  value: z.string(),
  source: z.string(),
  source_reference: z.string(),
  provenance_notes: z.array(z.string())
});

export const hadithRecordSchema = z.object({
  collection: z.string(),
  display_name: z.string(),
  book: z.string().nullable(),
  chapter: z.string().nullable(),
  hadith_number: z.string(),
  arabic_text: z.string(),
  english_text: z.string().nullable(),
  grade: gradeSchema.nullable(),
  source_dataset: z.string(),
  source_url_or_reference: z.string(),
  provenance_notes: z.array(z.string())
});

export const searchResultSchema = hadithRecordSchema.extend({
  snippet: z.string(),
  rank: z.number().int().positive()
});

export const toolErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    provenance_notes: z.array(z.string())
  })
});

export const listCollectionsInputShape = {};

export const listCollectionsOutputShape = {
  collections: z.array(collectionSummarySchema)
};

export const referenceInputShape = {
  collection: z.string().min(1).describe("Collection id or alias, such as bukhari or sahih-bukhari."),
  hadith_number: z
    .union([z.string().min(1), z.number().int().positive()])
    .describe("Collection-local number, collection-prefixed reference, or source URL/reference.")
};

export const fetchHadithInputShape = {
  ...referenceInputShape,
  language: languageSchema.default("both").describe("arabic, english, or both.")
};

export const fetchHadithOutputShape = {
  result: z.union([hadithRecordSchema, toolErrorSchema])
};

export const searchHadithInputShape = {
  query: z.string().min(1).describe("Arabic or English search query."),
  collection: z.string().min(1).optional().describe("Optional collection id or alias."),
  language: languageSchema.default("both").describe("arabic, english, or both."),
  limit: z.number().int().min(1).max(50).default(10),
  offset: z.number().int().min(0).default(0)
};

export const searchHadithOutputShape = {
  query: z.string(),
  collection: z.string().nullable(),
  language: languageSchema,
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  results: z.array(searchResultSchema),
  provenance_notes: z.array(z.string())
};

export const validateReferenceOutputShape = {
  valid: z.boolean(),
  collection: z.string(),
  canonical_collection: z.string().nullable(),
  hadith_number: z.string(),
  suggestions: z.array(
    z.object({
      collection: z.string(),
      hadith_number: z.string(),
      reason: z.string()
    })
  ),
  provenance_notes: z.array(z.string())
};

export const metadataOutputShape = {
  result: z.union([
    z.object({
      collection: z.string(),
      display_name: z.string(),
      book: z.string().nullable(),
      chapter: z.string().nullable(),
      hadith_number: z.string(),
      numbering: z.object({
        scheme: z.string(),
        value: z.string()
      }),
      source_dataset: z.string(),
      import_version: z.string(),
      provenance_notes: z.array(z.string())
    }),
    toolErrorSchema
  ])
};

export const gradeOutputShape = {
  result: z.union([
    z.object({
      collection: z.string(),
      hadith_number: z.string(),
      grade: gradeSchema.nullable(),
      provenance_notes: z.array(z.string())
    }),
    toolErrorSchema
  ])
};

export const fetchHadithInputSchema = z.object(fetchHadithInputShape);
export const searchHadithInputSchema = z.object(searchHadithInputShape);
export const referenceInputSchema = z.object(referenceInputShape);
export const listCollectionsOutputSchema = z.object(listCollectionsOutputShape);
export const fetchHadithOutputSchema = z.object(fetchHadithOutputShape);
export const searchHadithOutputSchema = z.object(searchHadithOutputShape);
export const validateReferenceOutputSchema = z.object(validateReferenceOutputShape);
export const metadataOutputSchema = z.object(metadataOutputShape);
export const gradeOutputSchema = z.object(gradeOutputShape);
