import { describe, expect, it } from "vitest";
import { BASE_CATEGORIES, mergeCategories } from "./categories";

describe("mergeCategories", () => {
  it("includes all base categories", () => {
    const merged = mergeCategories([]);
    for (const c of BASE_CATEGORIES) expect(merged).toContain(c);
  });

  it("includes extra existing categories not in the base list", () => {
    const merged = mergeCategories(["Documentaire Animalier"]);
    expect(merged).toContain("Documentaire Animalier");
  });

  it("de-duplicates categories already in the base list", () => {
    const merged = mergeCategories(["Comédie", "Comédie"]);
    expect(merged.filter((c) => c === "Comédie")).toHaveLength(1);
  });
});
