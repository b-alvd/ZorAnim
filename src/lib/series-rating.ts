export type RatingRow = { userId: string; value: number };

// Series rating: average each user's ratings over the episodes first, then
// average those per-user means, so a viewer who rated every episode weighs
// the same as one who rated a single episode.
export function seriesRatingSummary(rows: RatingRow[]): { avg: number; count: number } | null {
  const byUser = new Map<string, { sum: number; n: number }>();
  for (const r of rows) {
    const e = byUser.get(r.userId) ?? { sum: 0, n: 0 };
    e.sum += r.value;
    e.n += 1;
    byUser.set(r.userId, e);
  }
  if (byUser.size === 0) return null;
  let total = 0;
  for (const e of byUser.values()) total += e.sum / e.n;
  return { avg: total / byUser.size, count: byUser.size };
}
