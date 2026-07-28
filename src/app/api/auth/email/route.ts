import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { verifyPassword } from "@/lib/auth/password";
import { isValidEmail } from "@/lib/auth/validate";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const newEmail = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";

  if (!isValidEmail(newEmail)) {
    return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
  }

  const [fullUser] = await db.select().from(users).where(eq(users.id, user.id));
  const validPassword = await verifyPassword(currentPassword, fullUser.passwordHash);
  if (!validPassword) {
    return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });
  }

  if (newEmail === fullUser.email) {
    return NextResponse.json({ error: "C'est déjà ton email actuel." }, { status: 400 });
  }

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, newEmail));
  if (existing) {
    return NextResponse.json({ error: "Un compte existe déjà avec cet email." }, { status: 409 });
  }

  const [updated] = await db
    .update(users)
    .set({ email: newEmail })
    .where(eq(users.id, user.id))
    .returning({ id: users.id, email: users.email });

  return NextResponse.json({ user: updated });
}
