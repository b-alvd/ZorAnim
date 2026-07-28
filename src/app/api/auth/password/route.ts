import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { isValidPassword, PASSWORD_REQUIREMENTS } from "@/lib/auth/validate";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (!isValidPassword(newPassword)) {
    return NextResponse.json({ error: PASSWORD_REQUIREMENTS }, { status: 400 });
  }

  const [fullUser] = await db.select().from(users).where(eq(users.id, user.id));
  const validPassword = await verifyPassword(currentPassword, fullUser.passwordHash);
  if (!validPassword) {
    return NextResponse.json({ error: "Mot de passe actuel incorrect." }, { status: 401 });
  }

  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));

  return NextResponse.json({ ok: true });
}
