import { describe, expect, it, vi, afterEach } from "vitest";
import { formatDuration, isNewActive } from "./format";

describe("formatDuration", () => {
  it("formats sub-hour durations in minutes", () => {
    expect(formatDuration(1)).toBe("1 min");
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(59)).toBe("59 min");
  });

  it("formats exact hours without minutes", () => {
    expect(formatDuration(60)).toBe("1h");
    expect(formatDuration(120)).toBe("2h");
  });

  it("formats hours with minutes, zero-padded", () => {
    expect(formatDuration(90)).toBe("1h30");
    expect(formatDuration(65)).toBe("1h05");
    expect(formatDuration(150)).toBe("2h30");
  });
});

describe("isNewActive", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns false for null", () => {
    expect(isNewActive(null)).toBe(false);
  });

  it("returns true within the 7-day window", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-10T00:00:00.000Z"));
    expect(isNewActive("2026-01-08T00:00:00.000Z")).toBe(true);
  });

  it("returns false once the 7-day window has passed", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-20T00:00:00.000Z"));
    expect(isNewActive("2026-01-08T00:00:00.000Z")).toBe(false);
  });

  it("is exclusive at exactly 7 days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T00:00:00.000Z"));
    expect(isNewActive("2026-01-08T00:00:00.000Z")).toBe(false);
  });
});
