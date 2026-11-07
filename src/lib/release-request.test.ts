import { describe, expect, it } from "vitest";
import { describeReleaseRequest, parseReleaseRequest, validateReleaseRequest } from "./release-request";

const NOW = new Date("2026-11-07T12:00:00Z").getTime();

describe("parseReleaseRequest", () => {
  it("falls back to an immediate release on missing or broken data", () => {
    expect(parseReleaseRequest(null).mode).toBe("now");
    expect(parseReleaseRequest("not json").mode).toBe("now");
    expect(parseReleaseRequest({ mode: "weird" }).mode).toBe("now");
  });

  it("keeps only the fields of the chosen mode", () => {
    const r = parseReleaseRequest(
      JSON.stringify({
        mode: "scheduled",
        releaseAt: "2026-12-01T19:00:00Z",
        premiereAt: "2026-11-30T19:00:00Z",
        premiereBanner: "x.jpg",
        note: "  merci  ",
      })
    );
    expect(r).toMatchObject({ mode: "scheduled", premiereAt: null, premiereBanner: null, note: "merci" });
    expect(r.releaseAt).toBe("2026-12-01T19:00:00.000Z");
  });
});

describe("validateReleaseRequest", () => {
  it("accepts an immediate release", () => {
    expect(validateReleaseRequest(parseReleaseRequest({ mode: "now" }), NOW)).toBeNull();
  });

  it("requires a future date", () => {
    expect(validateReleaseRequest(parseReleaseRequest({ mode: "scheduled" }), NOW)).toMatch(/date/);
    expect(
      validateReleaseRequest(parseReleaseRequest({ mode: "scheduled", releaseAt: "2026-01-01T00:00:00Z" }), NOW)
    ).toMatch(/futur/);
  });

  it("requires the official release after the premiere", () => {
    const r = parseReleaseRequest({
      mode: "premiere",
      premiereAt: "2026-12-10T19:00:00Z",
      releaseAt: "2026-12-09T19:00:00Z",
    });
    expect(validateReleaseRequest(r, NOW)).toMatch(/après/);
  });
});

describe("announcements", () => {
  it("keeps trailers only for an announcement, drops empty ones", () => {
    const r = parseReleaseRequest({
      mode: "announcement",
      releaseAt: "2026-12-01T19:00:00Z",
      trailers: [{ title: "Teaser", videoUrl: "a.mp4" }, { title: "Vide", videoUrl: "" }, { videoUrl: "b.mp4" }],
    });
    expect(r.releaseAt).toBeNull();
    expect(r.trailers).toEqual([
      { title: "Teaser", videoUrl: "a.mp4" },
      { title: "Bande-annonce", videoUrl: "b.mp4" },
    ]);
    expect(parseReleaseRequest({ mode: "now", trailers: [{ videoUrl: "a.mp4" }] }).trailers).toEqual([]);
  });

  it("is always valid and described with its trailers", () => {
    const r = parseReleaseRequest({ mode: "announcement", trailers: [{ videoUrl: "a.mp4" }] });
    expect(validateReleaseRequest(r, NOW)).toBeNull();
    expect(describeReleaseRequest(r)).toBe("Annonce avec 1 bande-annonce");
  });
});

describe("describeReleaseRequest", () => {
  it("describes each mode in Paris time", () => {
    expect(describeReleaseRequest(parseReleaseRequest({ mode: "now" }))).toBe("Dès l'acceptation");
    expect(describeReleaseRequest(parseReleaseRequest({ mode: "scheduled", releaseAt: "2026-12-12T19:00:00Z" }))).toBe(
      "Sortie le samedi 12 décembre à 20:00"
    );
    expect(
      describeReleaseRequest(parseReleaseRequest({ mode: "premiere", premiereAt: "2026-12-12T19:00:00Z" }))
    ).toBe("Avant-première le samedi 12 décembre à 20:00");
  });
});
