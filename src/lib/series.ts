import type { Film } from "@/data/types";
import { getPremiereStatus } from "@/lib/premiere";

export type CollapsedFilm = Film & { episodeCount: number };

export function isAnnouncement(f: Pick<Film, "episodeKind">): boolean {
  return f.episodeKind === "announcement";
}

type ReleaseFields = Pick<
  Film,
  | "seriesTitle"
  | "episodeKind"
  | "premiereAt"
  | "releaseAt"
  | "durationMinutes"
  | "videoDurationSeconds"
  | "premiereAdUrl"
  | "premiereAdDurationSeconds"
>;

// Out for viewers: a real video, not locked before its premiere or release
// (a premiere airing live counts as out).
export function isReleased(f: ReleaseFields): boolean {
  return !isAnnouncement(f) && getPremiereStatus(f) !== "locked";
}

// "Bientôt sur ZorAnim": a film that isn't out yet, or a series none of whose
// episodes is out yet (announcement fiche, or episodes still scheduled).
export function splitComingSoon<T extends ReleaseFields>(filmsList: T[]): { released: T[]; comingSoon: T[] } {
  const seriesOut = new Set<string>();
  for (const f of filmsList) {
    if (f.seriesTitle && isReleased(f)) seriesOut.add(f.seriesTitle);
  }
  const released: T[] = [];
  const comingSoon: T[] = [];
  for (const f of filmsList) {
    const isComingSoon = f.seriesTitle ? !seriesOut.has(f.seriesTitle) : !isReleased(f);
    (isComingSoon ? comingSoon : released).push(f);
  }
  return { released, comingSoon };
}

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
    // The card stands for the first real episode; an announcement fiche only
    // when the series has nothing else yet.
    const cover = sorted.find((e) => !isAnnouncement(e)) ?? sorted[0];
    const realCount = episodes.filter((e) => !isAnnouncement(e)).length;
    const index = placeholderIndex.get(seriesTitle)!;
    result[index] = { ...cover, episodeCount: trueEpisodeCounts?.get(seriesTitle) ?? realCount };
  }

  return result;
}

export function formatEpisodeTag(film: Pick<Film, "episodeKind" | "seasonNumber" | "episodeNumber">): string {
  if (isAnnouncement(film)) return "Annonce";
  return `S${film.seasonNumber ?? 1}E${film.episodeNumber ?? 1}`;
}

export function formatEpisodeLabel(film: Pick<Film, "episodeKind" | "seasonNumber" | "episodeNumber">): string {
  if (isAnnouncement(film)) return "Bientôt sur ZorAnim";
  return `Saison ${film.seasonNumber ?? 1} · Épisode ${film.episodeNumber ?? 1}`;
}

export function countFilmsAndSeries(films: Film[]): { filmCount: number; seriesCount: number } {
  let filmCount = 0;
  const seriesTitles = new Set<string>();
  for (const f of films) {
    if (f.seriesTitle) seriesTitles.add(f.seriesTitle);
    else filmCount++;
  }
  return { filmCount, seriesCount: seriesTitles.size };
}

export function formatCatalogCountLabel(filmCount: number, seriesCount: number): string {
  const parts: string[] = [];
  if (filmCount > 0) parts.push(`${filmCount} film${filmCount > 1 ? "s" : ""}`);
  if (seriesCount > 0) parts.push(`${seriesCount} série${seriesCount > 1 ? "s" : ""}`);
  return parts.length > 0 ? parts.join(", ") : "Aucun contenu";
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

// Episode title without the series name when it repeats it
// ("Les Veilleurs, Ép. 3 : L'Éveil" → "Ép. 3 : L'Éveil"), whatever the separator.
export function episodeName(title: string, seriesTitle: string): string {
  if (!title.toLowerCase().startsWith(seriesTitle.toLowerCase())) return title;
  return title.slice(seriesTitle.length).replace(/^\s*[—–:|·-]\s*/, "").trim() || title;
}
