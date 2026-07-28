import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
};

export async function createSession(userId: string): Promise<{ id: string; expiresAt: Date }> {
  const id = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await db.insert(sessions).values({ id, userId, expiresAt });
  return { id, expiresAt };
}

export async function validateSession(sessionId: string): Promise<SessionUser | null> {
  const [row] = await db
    .select({
      sessionExpiresAt: sessions.expiresAt,
      userId: users.id,
      email: users.email,
      name: users.name,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId));

  if (!row) return null;
  if (row.sessionExpiresAt.getTime() < Date.now()) {
    await deleteSession(sessionId);
    return null;
  }

  return {
    id: row.userId,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatarUrl,
    createdAt: row.createdAt,
  };
}

export async function deleteSession(sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}
