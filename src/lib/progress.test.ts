import { describe, expect, it } from "vitest";
import type { Film } from "@/data/types";
import { getContinueItems } from "./progress";

function film(id: string, extra: Partial<Film> = {}): Film {
  return {
    id,
    title: id,
    synopsis: "",
    year: 2026,
    duration: "20 min",
    durationMinutes: 20,
    rating: "Tout public",
    category: "Action",
    artistId: "a",
    artistName: "A",
    isStudioAttribution: false,
    isNew: false,
    poster: "",
    videoUrl: "",
    avgRating: null,
    ratingCount: 0,
    episodeAvgRating: null,
    episodeRatingCount: 0,
    seriesTitle: null,
    seasonNumber: null,
    episodeNumber: null,
    episodeKind: "episode",
    teaserVideoUrl: null,
    trailers: [],
    seriesSynopsis: null,
    premiereAt: null,
    premiereBanner: null,
    releaseBanner: null,
    premiereAdUrl: null,
    premiereAdDurationSeconds: null,
    releaseAt: null,
    videoDurationSeconds: null,
    ...extra,
  };
}

const ep = (n: number) => film(`e${n}`, { seriesTitle: "S", seasonNumber: 1, episodeNumber: n });

describe("getContinueItems", () => {
  it("resumes a film left in the middle, ignores finished or barely started ones", () => {
    const items = getContinueItems(
      [film("f1"), film("f2"), film("f3")],
      new Map([
        ["f1", { at: "2026-01-02", position: 300 }],
        ["f2", { at: "2026-01-03", position: 0 }],
        ["f3", { at: "2026-01-04", position: 4 }],
      ]),
      10
    );
    expect(items.map((i) => [i.film.id, i.mode, i.position])).toEqual([["f1", "resume", 300]]);
  });

  it("offers the next episode after a finished one", () => {
    const items = getContinueItems(
      [ep(1), ep(2), ep(3)],
      new Map([
        ["e1", { at: "2026-01-01", position: 0 }],
        ["e2", { at: "2026-01-02", position: 0 }],
      ]),
      10
    );
    expect(items.map((i) => [i.film.id, i.mode])).toEqual([["e3", "next"]]);
  });

  it("resumes the last watched episode when left in the middle", () => {
    const items = getContinueItems(
      [ep(1), ep(2)],
      new Map([
        ["e1", { at: "2026-01-01", position: 0 }],
        ["e2", { at: "2026-01-02", position: 500 }],
      ]),
      10
    );
    expect(items.map((i) => [i.film.id, i.mode, i.position])).toEqual([["e2", "resume", 500]]);
  });

  it("restarts a barely started episode, and drops a finished series", () => {
    const started = getContinueItems([ep(1), ep(2)], new Map([["e2", { at: "2026-01-02", position: 3 }]]), 10);
    expect(started.map((i) => [i.film.id, i.mode])).toEqual([["e2", "start"]]);
    const done = getContinueItems([ep(1), ep(2)], new Map([["e2", { at: "2026-01-02", position: 0 }]]), 10);
    expect(done).toEqual([]);
  });

  it("sorts by last activity", () => {
    const items = getContinueItems(
      [film("f1"), ep(1), ep(2)],
      new Map([
        ["f1", { at: "2026-01-01", position: 300 }],
        ["e1", { at: "2026-01-05", position: 0 }],
      ]),
      10
    );
    expect(items.map((i) => i.film.id)).toEqual(["e2", "f1"]);
  });
});
