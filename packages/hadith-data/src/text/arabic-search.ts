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

function arabicTokenVariants(token: string): string[] {
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

export function searchTextForIndex(text: string, language: string): string {
  if (language !== "arabic" && !arabicPattern.test(text)) {
    return text;
  }

  const normalizedText = normalizeArabicToken(text);
  const expandedTokens = normalizedText
    .split(/[^\p{L}\p{N}]+/u)
    .flatMap((token) => (arabicPattern.test(token) ? arabicTokenVariants(token) : [token]))
    .filter((token) => token.length > 0);

  return `${normalizedText} ${expandedTokens.join(" ")}`.trim();
}
