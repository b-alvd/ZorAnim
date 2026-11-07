import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getFilm, saveWatchPosition } from "@/db/queries";
import { storedPosition } from "@/lib/watch-progress";

// Saves where the user stopped watching. Called by the player while it plays,
// on pause, at the end and when the page is left (navigator.sendBeacon, whose
// body arrives as text, hence the manual JSON parsing).
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { id } = await params;
  let body: { position?: unknown; duration?: unknown; ended?: unknown };
  try {
    body = JSON.parse(await request.text());
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const position = Number(body.position);
  const duration = Number(body.duration);
  if (!Number.isFinite(position) || position < 0) {
    return NextResponse.json({ error: "Position invalide." }, { status: 400 });
  }

  const film = await getFilm(id);
  if (!film || film.episodeKind === "announcement") {
    return NextResponse.json({ error: "Contenu introuvable." }, { status: 404 });
  }

  await saveWatchPosition(
    user.id,
    id,
    storedPosition(position, Number.isFinite(duration) ? duration : 0, body.ended === true)
  );
  return NextResponse.json({ ok: true });
}
