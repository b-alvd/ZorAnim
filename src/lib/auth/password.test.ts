import { describe, expect, it } from "vitest";
import { generateTemporaryPassword, hashPassword, verifyPassword } from "./password";
import { isValidPassword } from "./validate";

describe("generateTemporaryPassword", () => {
  it("always meets the site's password rules", () => {
    for (let i = 0; i < 200; i++) {
      expect(isValidPassword(generateTemporaryPassword())).toBe(true);
    }
  });

  it("avoids look-alike characters", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateTemporaryPassword()).not.toMatch(/[0O1lI]/);
    }
  });

  it("can be verified once hashed", async () => {
    const temporary = generateTemporaryPassword();
    const hash = await hashPassword(temporary);
    expect(await verifyPassword(temporary, hash)).toBe(true);
    expect(await verifyPassword("autre-chose", hash)).toBe(false);
  });
});
