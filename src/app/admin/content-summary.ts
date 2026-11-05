import type { Film } from "@/data/types";

// One entry per film or per series (its episodes pooled), as listed for an
// artist or a studio in the admin.
export type ContentSummary = {
  key: string;
  id: string;
  title: string;
  kind: "film" | "series";
  episodeCount: number;
  poster: string;
  category: string;
  // Studio name when the content is credited to a studio of the artist.
  via: string | null;
  views: number;
  comments: number;
  avgRating: number | null;
  ratingCount: number;
  latestAt: string;
};

export function summarizeContents(
  list: Film[],
  via: string | null,
  engagement: Map<string, { views: number; comments: number }>,
  createdAts: Map<string, string>
): ContentSummary[] {
  const groups = new Map<string, Film[]>();
  for (const f of list) {
    const key = f.seriesTitle ?? f.id;
    groups.set(key, [...(groups.get(key) ?? []), f]);
  }
  return [...groups.entries()].map(([key, films]) => {
    const real = films.filter((f) => f.episodeKind !== "announcement");
    const cover = real[0] ?? films[0];
    return {
      key,
      id: cover.id,
      title: cover.seriesTitle ?? cover.title,
      kind: cover.seriesTitle ? "series" : "film",
      episodeCount: cover.seriesTitle ? real.length : 0,
      poster: cover.poster,
      category: cover.category,
      via,
      views: films.reduce((n, f) => n + (engagement.get(f.id)?.views ?? 0), 0),
      comments: films.reduce((n, f) => n + (engagement.get(f.id)?.comments ?? 0), 0),
      avgRating: cover.avgRating,
      ratingCount: cover.ratingCount,
      latestAt: films.reduce((max, f) => {
        const at = createdAts.get(f.id) ?? "";
        return at > max ? at : max;
      }, ""),
    };
  });
}

// Totals over a list of contents; the rating is weighted by voters.
export function contentStats(contents: ContentSummary[]) {
  const films = contents.filter((c) => c.kind === "film").length;
  const series = contents.filter((c) => c.kind === "series").length;
  const episodes = contents.reduce((n, c) => n + c.episodeCount, 0);
  const views = contents.reduce((n, c) => n + c.views, 0);
  const comments = contents.reduce((n, c) => n + c.comments, 0);
  const rated = contents.filter((c) => c.avgRating !== null && c.ratingCount > 0);
  const voters = rated.reduce((n, c) => n + c.ratingCount, 0);
  const rating = voters > 0 ? rated.reduce((n, c) => n + c.avgRating! * c.ratingCount, 0) / voters : null;
  const latestAt = contents.reduce((max, c) => (c.latestAt > max ? c.latestAt : max), "");
  return { films, series, episodes, views, comments, rating, voters, latestAt };
}
