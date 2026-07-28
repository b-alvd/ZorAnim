import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { verifyPassword } from "@/lib/auth/password";
import { clearSessionCookie } from "@/lib/auth/cookies";

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";

  const [fullUser] = await db.select().from(users).where(eq(users.id, user.id));
  const validPassword = await verifyPassword(currentPassword, fullUser.passwordHash);
  if (!validPassword) {
    return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });
  }

  // Sessions are removed automatically via the foreign key ON DELETE CASCADE.
  await db.delete(users).where(eq(users.id, user.id));
  await clearSessionCookie();

  return NextResponse.json({ ok: true });
}
