import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";

const MAX_AVATAR_BYTES = 1_500_000; // ~1.5MB, comfortably under Turso row limits

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const avatarUrl = typeof body?.avatarUrl === "string" ? body.avatarUrl : undefined;
  const name = typeof body?.name === "string" ? body.name.trim() : undefined;

  if (avatarUrl !== undefined) {
    if (!avatarUrl.startsWith("data:image/")) {
      return NextResponse.json({ error: "Format d'image invalide." }, { status: 400 });
    }
    if (avatarUrl.length > MAX_AVATAR_BYTES) {
      return NextResponse.json({ error: "Image trop lourde (1.5 Mo max)." }, { status: 400 });
    }
  }

  if (name !== undefined && !name) {
    return NextResponse.json({ error: "Le nom ne peut pas être vide." }, { status: 400 });
  }

  const [updated] = await db
    .update(users)
    .set({
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
      ...(name !== undefined ? { name } : {}),
    })
    .where(eq(users.id, user.id))
    .returning({ id: users.id, name: users.name, avatarUrl: users.avatarUrl });

  return NextResponse.json({ user: updated });
}
