import { getSessionCookie } from "@/lib/auth/cookies";
import { validateSession, type SessionUser } from "@/lib/auth/session";

export async function getCurrentUser(): Promise<SessionUser | null> {
  const sessionId = await getSessionCookie();
  if (!sessionId) return null;
  return validateSession(sessionId);
}
