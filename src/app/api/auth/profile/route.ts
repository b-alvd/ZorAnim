import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";

const MAX_AVATAR_BYTES = 1_500_000; // ~1.5MB, comfortably under Turso row limits
const NAME_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

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

  let nameChangedAt: string | undefined;

  if (name !== undefined) {
    const [fullUser] = await db.select().from(users).where(eq(users.id, user.id));

    if (name !== fullUser.name) {
      if (fullUser.nameChangedAt) {
        const lastChange = new Date(fullUser.nameChangedAt).getTime();
        const elapsed = Date.now() - lastChange;
        if (!Number.isNaN(elapsed) && elapsed < NAME_COOLDOWN_MS) {
          const daysLeft = Math.ceil((NAME_COOLDOWN_MS - elapsed) / (24 * 60 * 60 * 1000));
          return NextResponse.json(
            {
              error: `Tu pourras changer de pseudo dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""}.`,
            },
            { status: 429 }
          );
        }
      }
      nameChangedAt = new Date().toISOString();
    }
  }

  const [updated] = await db
    .update(users)
    .set({
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
      ...(name !== undefined ? { name } : {}),
      ...(nameChangedAt !== undefined ? { nameChangedAt } : {}),
    })
    .where(eq(users.id, user.id))
    .returning({ id: users.id, name: users.name, avatarUrl: users.avatarUrl, nameChangedAt: users.nameChangedAt });

  return NextResponse.json({ user: updated });
}
