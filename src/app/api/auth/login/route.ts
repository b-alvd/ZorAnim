import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { setSessionCookie } from "@/lib/auth/cookies";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";

export async function POST(request: Request) {
  if (isRateLimited(`login:${getClientIp(request)}`, 10, 5 * 60 * 1000)) {
    return NextResponse.json({ error: "Trop de tentatives, réessaie dans quelques minutes." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email et mot de passe requis." }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.email, email));
  const invalidCredentials = () =>
    NextResponse.json({ error: "Email ou mot de passe incorrect." }, { status: 401 });

  if (!user) return invalidCredentials();

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return invalidCredentials();

  const session = await createSession(user.id);
  await setSessionCookie(session.id, session.expiresAt);

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
  });
}
