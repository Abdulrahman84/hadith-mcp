import { createHash } from "node:crypto";

/**
 * Bump when the embedding text recipe changes so the index builder re-embeds every row.
 */
export const embeddingTextRecipe = "ar-noharakat+en/v1";

const maxArabicChars = 2000;
const maxEnglishChars = 1500;
const arabicMarksPattern = /[ؐ-ًؚ-ٰٟۖ-ۭ]/g;
const decorativePattern = /[ـ‎‏‪-‮]/g;

function collapse(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function stripArabicMarks(value: string): string {
  return collapse(value.replace(arabicMarksPattern, "").replace(decorativePattern, ""));
}

/**
 * One text per hadith: the full Arabic text (harakat removed) followed by the English
 * translation when present. The isnad is kept because the dataset has no reliable
 * isnad/matn boundary and a heuristic cut can drop the question or story that gives the
 * matn its meaning.
 */
export function embeddingTextForHadith(arabicText: string | null, englishText: string | null): string {
  const arabic = arabicText ? stripArabicMarks(arabicText).slice(0, maxArabicChars) : "";
  const english = englishText ? collapse(englishText).slice(0, maxEnglishChars) : "";

  return [arabic, english].filter((part) => part.length > 0).join("\n\n");
}

export function embeddingTextHash(text: string): string {
  return createHash("sha256").update(embeddingTextRecipe).update("\0").update(text).digest("hex");
}

export function embeddingQueryText(query: string): string {
  return stripArabicMarks(query);
}
