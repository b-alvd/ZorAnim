import { describe, expect, it } from "vitest";
import { normalize, matchesQuery } from "./search";

describe("normalize", () => {
  it("strips accents", () => {
    expect(normalize("café")).toBe("cafe");
    expect(normalize("Éléphant")).toBe("elephant");
  });

  it("lowercases", () => {
    expect(normalize("HELLO")).toBe("hello");
  });
});

describe("matchesQuery", () => {
  it("matches an empty query against anything", () => {
    expect(matchesQuery("", "Café Noir")).toBe(true);
    expect(matchesQuery("   ", "Café Noir")).toBe(true);
  });

  it("matches case- and accent-insensitively", () => {
    expect(matchesQuery("cafe", "Café Noir")).toBe(true);
    expect(matchesQuery("CAFE", "Café Noir")).toBe(true);
  });

  it("matches a substring anywhere in the field", () => {
    expect(matchesQuery("noir", "Café Noir")).toBe(true);
  });

  it("returns false when nothing matches", () => {
    expect(matchesQuery("xyz", "Café Noir")).toBe(false);
  });

  it("matches if any of several fields match", () => {
    expect(matchesQuery("noir", "Café", "Le Grand Noir", "autre")).toBe(true);
  });
});
