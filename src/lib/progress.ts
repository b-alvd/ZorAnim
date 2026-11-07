import type { Film } from "@/data/types";
import { isAnnouncement } from "./series";

export type SeriesProgress = {
  seriesTitle: string;
  watched: number;
  total: number;
  // First episode not watched yet, in episode order; null when all are seen.
  next: Film | null;
  // Last time the user watched an episode of the series (ISO), "" if never.
  lastWatchedAt: string;
};

function episodeOrder(a: Film, b: Film) {
  return (a.seasonNumber ?? 0) - (b.seasonNumber ?? 0) || (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0);
}

// Progress of the user in each series, over the episodes that can be watched
// (`released` must only hold released contents).
export function getSeriesProgress(
  released: Film[],
  watchedAt: Map<string, string>
): Map<string, SeriesProgress> {
  const bySeries = new Map<string, Film[]>();
  for (const f of released) {
    if (!f.seriesTitle || isAnnouncement(f)) continue;
    bySeries.set(f.seriesTitle, [...(bySeries.get(f.seriesTitle) ?? []), f]);
  }
  const result = new Map<string, SeriesProgress>();
  for (const [seriesTitle, episodes] of bySeries) {
    const sorted = [...episodes].sort(episodeOrder);
    const seen = sorted.filter((e) => watchedAt.has(e.id));
    result.set(seriesTitle, {
      seriesTitle,
      watched: seen.length,
      total: sorted.length,
      next: sorted.find((e) => !watchedAt.has(e.id)) ?? null,
      lastWatchedAt: seen.reduce((max, e) => (watchedAt.get(e.id)! > max ? watchedAt.get(e.id)! : max), ""),
    });
  }
  return result;
}

export type ContinueMode = "resume" | "next" | "start";

export type ContinueItem = {
  // Series title, or film id for a standalone film.
  key: string;
  // What to play.
  film: Film;
  mode: ContinueMode;
  // Resume point (seconds); 0 unless mode is "resume".
  position: number;
  // Length of `film` in seconds.
  duration: number;
  // Last activity (ISO), to sort the list.
  at: string;
};

type Entry = { at: string; position: number };

export function contentDuration(f: Film): number {
  return f.videoDurationSeconds ?? f.durationMinutes * 60;
}

// What "Reprendre" offers, from the stopping points (`released` must only hold
// released contents):
// - a film or an episode left in the middle: resume it there ("resume");
// - a series whose last watched episode was finished: the episode after it
//   ("next"), or nothing if it was the last one;
// - a series whose last episode was barely started: that episode from the
//   start ("start").
export function getContinueItems(
  released: Film[],
  entries: Map<string, Entry>,
  minResumeSeconds: number
): ContinueItem[] {
  const items: ContinueItem[] = [];
  const bySeries = new Map<string, Film[]>();

  for (const f of released) {
    if (isAnnouncement(f)) continue;
    if (f.seriesTitle) {
      bySeries.set(f.seriesTitle, [...(bySeries.get(f.seriesTitle) ?? []), f]);
      continue;
    }
    const e = entries.get(f.id);
    if (e && e.position >= minResumeSeconds) {
      items.push({ key: f.id, film: f, mode: "resume", position: e.position, duration: contentDuration(f), at: e.at });
    }
  }

  for (const [seriesTitle, episodes] of bySeries) {
    const sorted = [...episodes].sort(episodeOrder);
    const watched = sorted.filter((e) => entries.has(e.id));
    if (watched.length === 0) continue;
    const last = watched.reduce((a, b) => (entries.get(b.id)!.at > entries.get(a.id)!.at ? b : a));
    const entry = entries.get(last.id)!;
    const base = { key: seriesTitle, at: entry.at };
    if (entry.position >= minResumeSeconds) {
      items.push({ ...base, film: last, mode: "resume", position: entry.position, duration: contentDuration(last) });
    } else if (entry.position > 0) {
      items.push({ ...base, film: last, mode: "start", position: 0, duration: contentDuration(last) });
    } else {
      const next = sorted[sorted.indexOf(last) + 1];
      if (next) items.push({ ...base, film: next, mode: "next", position: 0, duration: contentDuration(next) });
    }
  }

  return items.sort((a, b) => b.at.localeCompare(a.at));
}
