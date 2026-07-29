import type { Film } from "@/data/types";

export type CollapsedFilm = Film & { episodeCount: number };

export function collapseSeries(films: Film[], trueEpisodeCounts?: Map<string, number>): CollapsedFilm[] {
  const result: CollapsedFilm[] = [];
  const groups = new Map<string, Film[]>();
  const placeholderIndex = new Map<string, number>();

  for (const film of films) {
    if (!film.seriesTitle) {
      result.push({ ...film, episodeCount: 1 });
      continue;
    }
    if (!groups.has(film.seriesTitle)) {
      groups.set(film.seriesTitle, [film]);
      placeholderIndex.set(film.seriesTitle, result.length);
      result.push({ ...film, episodeCount: 1 });
    } else {
      groups.get(film.seriesTitle)!.push(film);
    }
  }

  for (const [seriesTitle, episodes] of groups) {
    const sorted = [...episodes].sort(
      (a, b) => (a.seasonNumber ?? 0) - (b.seasonNumber ?? 0) || (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0)
    );
    const index = placeholderIndex.get(seriesTitle)!;
    result[index] = { ...sorted[0], episodeCount: trueEpisodeCounts?.get(seriesTitle) ?? episodes.length };
  }

  return result;
}

export function computeEffectiveWatchedIds(
  collapsed: CollapsedFilm[],
  watchedIds: Set<string>,
  episodeIdsMap: Map<string, string[]>
): Set<string> {
  const result = new Set<string>();
  for (const f of collapsed) {
    if (!f.seriesTitle) {
      if (watchedIds.has(f.id)) result.add(f.id);
      continue;
    }
    const ids = episodeIdsMap.get(f.seriesTitle);
    if (ids && ids.length > 0 && ids.every((id) => watchedIds.has(id))) result.add(f.id);
  }
  return result;
}
