import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { artists, studios, users } from "@/db/schema";
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

  // Every artist profile belongs to an account: keep the profile (and its
  // films) from being orphaned. The staff can transfer or remove it.
  const [artist] = await db.select({ name: artists.name }).from(artists).where(eq(artists.userId, user.id));
  if (artist) {
    return NextResponse.json(
      {
        error: `Ton compte porte le profil d'artiste ${artist.name}. Contacte l'équipe via la page Contact pour le supprimer ou le transférer avant de supprimer ton compte.`,
      },
      { status: 409 }
    );
  }

  const owned = await db.select({ name: studios.name }).from(studios).where(eq(studios.ownerId, user.id));
  if (owned.length) {
    return NextResponse.json(
      {
        error: `Tu as fondé ${owned.map((s) => s.name).join(", ")}. Contacte l'équipe via la page Contact pour transférer ou supprimer le studio avant de supprimer ton compte.`,
      },
      { status: 409 }
    );
  }

  // Sessions are removed automatically via the foreign key ON DELETE CASCADE.
  await db.delete(users).where(eq(users.id, user.id));
  await clearSessionCookie();

  return NextResponse.json({ ok: true });
}
