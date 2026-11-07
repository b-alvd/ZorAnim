import type { Film } from "@/data/types";
import { formatEpisodeTag, isAnnouncement, type CollapsedFilm } from "./series";

export type RecentFilm = CollapsedFilm & {
  addedAt: string;
  // The content that made it new: the film itself, or the series' latest episode.
  latest: Film;
};

// Sorts collapsed cards by when they reached the catalogue, most recent
// first. A series counts from its latest episode among `films`, so a new
// episode brings it back to the top.
export function sortByAdded(collapsed: CollapsedFilm[], films: Film[], dates: Map<string, string>): RecentFilm[] {
  const latestBySeries = new Map<string, { at: string; film: Film }>();
  for (const f of films) {
    if (!f.seriesTitle || isAnnouncement(f)) continue;
    const at = dates.get(f.id) ?? "";
    const current = latestBySeries.get(f.seriesTitle);
    if (!current || at > current.at) latestBySeries.set(f.seriesTitle, { at, film: f });
  }
  return collapsed
    .map((f) => {
      const latest = f.seriesTitle ? latestBySeries.get(f.seriesTitle) : undefined;
      return { ...f, addedAt: latest?.at ?? dates.get(f.id) ?? "", latest: latest?.film ?? f };
    })
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}

// What a recent card brings: "Nouveau film", "Nouvelle série" or the new episode.
export function describeNew(f: RecentFilm): string {
  if (!f.seriesTitle) return "Nouveau film";
  if (f.episodeCount <= 1) return "Nouvelle série";
  return `Nouvel épisode · ${formatEpisodeTag(f.latest)}`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function formatAgo(iso: string, now: number): string {
  const days = Math.floor((now - new Date(iso).getTime()) / DAY_MS);
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days} jours`;
  if (days < 31) {
    const weeks = Math.round(days / 7);
    return `Il y a ${weeks} semaine${weeks > 1 ? "s" : ""}`;
  }
  return `Le ${new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" })}`;
}

// Groups recent cards into "this week", "this month" and "earlier".
export function groupByAge(films: RecentFilm[], now: number): { title: string; films: RecentFilm[] }[] {
  const groups = [
    { title: "Cette semaine", maxAge: 7 * DAY_MS, films: [] as RecentFilm[] },
    { title: "Ce mois-ci", maxAge: 31 * DAY_MS, films: [] as RecentFilm[] },
    { title: "Plus tôt", maxAge: Infinity, films: [] as RecentFilm[] },
  ];
  for (const f of films) {
    const age = now - new Date(f.addedAt).getTime();
    (groups.find((g) => age <= g.maxAge) ?? groups[2]).films.push(f);
  }
  return groups.filter((g) => g.films.length > 0).map(({ title, films: list }) => ({ title, films: list }));
}
