import { describe, expect, it } from "vitest";
import { formatRemaining, isFinished, storedPosition } from "./watch-progress";

describe("storedPosition", () => {
  it("keeps the position in the middle of a content", () => {
    expect(storedPosition(312.4, 1200)).toBe(312);
  });

  it("keeps a small non-zero position when barely started", () => {
    expect(storedPosition(4, 1200)).toBe(4);
    expect(storedPosition(0.2, 1200)).toBe(1);
  });

  it("stores 0 when finished, near the end or past 97 %", () => {
    expect(storedPosition(600, 1200, true)).toBe(0);
    expect(storedPosition(1185, 1200)).toBe(0);
    expect(storedPosition(5820, 6000)).toBe(0);
  });

  it("keeps the position when the duration is unknown", () => {
    expect(storedPosition(300, 0)).toBe(300);
  });
});

describe("isFinished", () => {
  it("is false in the middle", () => {
    expect(isFinished(100, 1200)).toBe(false);
  });
});

describe("formatRemaining", () => {
  it("formats minutes and hours", () => {
    expect(formatRemaining(30)).toBe("Reste 1 min");
    expect(formatRemaining(12 * 60)).toBe("Reste 12 min");
    expect(formatRemaining(90 * 60)).toBe("Reste 1 h 30");
    expect(formatRemaining(120 * 60)).toBe("Reste 2 h");
  });
});
