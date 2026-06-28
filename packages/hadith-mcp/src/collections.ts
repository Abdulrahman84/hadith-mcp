export const collectionAliases = new Map<string, string>([
  ["bukhari", "bukhari"],
  ["sahih-bukhari", "bukhari"],
  ["sahih-al-bukhari", "bukhari"],
  ["sahih_al_bukhari", "bukhari"],
  ["muslim", "muslim"],
  ["sahih-muslim", "muslim"],
  ["abu-dawud", "abu_dawud"],
  ["abu_dawud", "abu_dawud"],
  ["sunan-abi-dawud", "abu_dawud"],
  ["abudawud", "abu_dawud"],
  ["tirmidhi", "tirmidhi"],
  ["jami-tirmidhi", "tirmidhi"],
  ["jami-at-tirmidhi", "tirmidhi"],
  ["nasai", "nasai"],
  ["nasaii", "nasai"],
  ["nasa'i", "nasai"],
  ["nasa’i", "nasai"],
  ["ibn-majah", "ibn_majah"],
  ["ibn_majah", "ibn_majah"],
  ["ibnmajah", "ibn_majah"]
]);

export function canonicalizeCollection(collection: string): string | null {
  return collectionAliases.get(collection.trim().toLowerCase().replace(/\s+/g, "-")) ?? null;
}

export function normalizeHadithNumber(hadithNumber: string | number): string {
  return String(hadithNumber).trim();
}
