import { getCurrentUser } from "@/lib/auth/current-user";
import type { SessionUser } from "@/lib/auth/session";

// Server actions are public POST endpoints: anyone who finds an action's ID
// can call it, whatever page rendered it. The admin layout only guards the
// pages, so every admin action must check the role itself, first thing.
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") throw new Error("Non autorisé.");
  return user;
}
