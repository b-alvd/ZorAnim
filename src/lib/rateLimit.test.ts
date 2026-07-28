import { describe, expect, it, vi, afterEach } from "vitest";
import { isRateLimited, getClientIp } from "./rateLimit";

describe("isRateLimited", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to the limit", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      expect(isRateLimited(key, 5, 60_000)).toBe(false);
    }
  });

  it("blocks once the limit is exceeded", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 5; i++) isRateLimited(key, 5, 60_000);
    expect(isRateLimited(key, 5, 60_000)).toBe(true);
  });

  it("resets after the time window passes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 5; i++) isRateLimited(key, 5, 60_000);
    expect(isRateLimited(key, 5, 60_000)).toBe(true);

    vi.setSystemTime(new Date("2026-01-01T00:01:01.000Z"));
    expect(isRateLimited(key, 5, 60_000)).toBe(false);
  });

  it("tracks separate keys independently", () => {
    const keyA = `test-a-${Math.random()}`;
    const keyB = `test-b-${Math.random()}`;
    for (let i = 0; i < 5; i++) isRateLimited(keyA, 5, 60_000);
    expect(isRateLimited(keyA, 5, 60_000)).toBe(true);
    expect(isRateLimited(keyB, 5, 60_000)).toBe(false);
  });
});

describe("getClientIp", () => {
  it("returns the first IP from x-forwarded-for", () => {
    const req = new Request("https://example.com", { headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" } });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("returns unknown when the header is missing", () => {
    const req = new Request("https://example.com");
    expect(getClientIp(req)).toBe("unknown");
  });
});
