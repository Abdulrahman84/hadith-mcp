const arabicPattern = /[\u0600-\u06ff]/;
const arabicMarksPattern = /[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]/g;
const tatweelPattern = /\u0640/g;

function normalizeArabicToken(token: string): string {
  return token
    .replace(arabicMarksPattern, "")
    .replace(tatweelPattern, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي");
}

function arabicQueryVariants(token: string): string[] {
  const variants = new Set<string>([token]);
  const definiteArticlePrefixes = ["ال", "وال", "فال", "بال", "كال", "لل"];

  for (const prefix of definiteArticlePrefixes) {
    if (token.startsWith(prefix) && token.length > prefix.length + 1) {
      variants.add(token.slice(prefix.length));
    }
  }

  for (const variant of Array.from(variants)) {
    if (variant.endsWith("ة")) {
      variants.add(`${variant.slice(0, -1)}ه`);
    }

    if (variant.endsWith("ه")) {
      variants.add(`${variant.slice(0, -1)}ة`);
    }
  }

  return Array.from(variants).filter((variant) => variant.length > 0);
}

export function searchTermsForQuery(term: string): string[] {
  const normalized = normalizeArabicToken(term);

  if (!arabicPattern.test(normalized)) {
    return normalized.length > 0 ? [normalized] : [];
  }

  return arabicQueryVariants(normalized);
}
