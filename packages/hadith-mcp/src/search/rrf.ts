export const defaultRrfK = 60;

export type RankedList = {
  name: string;
  keys: string[];
  /** Multiplier for this list's contribution. Defaults to 1; lists with weight 0 are ignored. */
  weight?: number;
};

export type FusedItem = {
  key: string;
  score: number;
  /** 1-based rank in each input list, or null when the item was absent from it. */
  ranks: Record<string, number | null>;
};

/**
 * Weighted Reciprocal Rank Fusion: score(d) = Σ w_i / (k + rank_i(d)). Ties keep the order
 * in which keys first appear across the lists, so the first list wins ties.
 */
export function reciprocalRankFusion(lists: RankedList[], k: number = defaultRrfK): FusedItem[] {
  const items = new Map<string, FusedItem & { firstSeen: number }>();
  let seen = 0;

  for (const list of lists) {
    const weight = list.weight ?? 1;

    if (weight <= 0) {
      continue;
    }

    const unique = [...new Set(list.keys)];

    unique.forEach((key, index) => {
      const rank = index + 1;
      let item = items.get(key);

      if (!item) {
        item = {
          key,
          score: 0,
          ranks: Object.fromEntries(lists.map((other) => [other.name, null])),
          firstSeen: seen
        };
        seen += 1;
        items.set(key, item);
      }

      item.score += weight / (k + rank);
      item.ranks[list.name] = rank;
    });
  }

  return [...items.values()]
    .sort((left, right) => right.score - left.score || left.firstSeen - right.firstSeen)
    .map(({ key, score, ranks }) => ({ key, score, ranks }));
}
