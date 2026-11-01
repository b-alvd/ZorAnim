import { afterEach, describe, expect, it, vi } from "vitest";
import type { SessionUser } from "./session";

const getCurrentUser = vi.fn<() => Promise<SessionUser | null>>();
vi.mock("@/lib/auth/current-user", () => ({ getCurrentUser: () => getCurrentUser() }));

const { requireAdmin } = await import("./require-admin");

const user = (role: string): SessionUser => ({
  id: "u1",
  email: "a@example.test",
  name: "A",
  nameChangedAt: null,
  avatarUrl: null,
  role,
  createdAt: "2026-01-01",
  banned: false,
  banReason: null,
  mustChangePassword: false,
});

describe("requireAdmin", () => {
  afterEach(() => getCurrentUser.mockReset());

  it("rejects visitors who aren't signed in", async () => {
    getCurrentUser.mockResolvedValue(null);
    await expect(requireAdmin()).rejects.toThrow("Non autorisé.");
  });

  it("rejects signed-in users who aren't admins", async () => {
    getCurrentUser.mockResolvedValue(user("user"));
    await expect(requireAdmin()).rejects.toThrow("Non autorisé.");
  });

  it("returns the admin", async () => {
    getCurrentUser.mockResolvedValue(user("admin"));
    await expect(requireAdmin()).resolves.toMatchObject({ id: "u1", role: "admin" });
  });
});
