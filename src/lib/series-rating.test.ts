import { describe, expect, it } from "vitest";
import { seriesRatingSummary } from "./series-rating";

describe("seriesRatingSummary", () => {
  it("returns null without ratings", () => {
    expect(seriesRatingSummary([])).toBeNull();
  });

  it("averages each user's episode ratings before averaging users", () => {
    const summary = seriesRatingSummary([
      { userId: "a", value: 5 },
      { userId: "a", value: 3 },
      { userId: "a", value: 4 },
      { userId: "b", value: 1 },
    ]);
    // a → 4, b → 1 → (4 + 1) / 2
    expect(summary).toEqual({ avg: 2.5, count: 2 });
  });

  it("matches a plain average for a single rating per user", () => {
    expect(seriesRatingSummary([
      { userId: "a", value: 2 },
      { userId: "b", value: 4 },
    ])).toEqual({ avg: 3, count: 2 });
  });
});
