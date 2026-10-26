import { NextResponse } from "next/server";
import { getPremiereViewerCount, heartbeatPremiereViewer, isPremiereLive } from "@/db/queries";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [count, live] = await Promise.all([getPremiereViewerCount(id), isPremiereLive(id)]);
  return NextResponse.json({ count, live });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const viewerId = body?.viewerId;
  if (typeof viewerId !== "string" || !viewerId) {
    return NextResponse.json({ error: "invalid viewerId" }, { status: 400 });
  }
  const [count, live] = await Promise.all([heartbeatPremiereViewer(viewerId, id), isPremiereLive(id)]);
  // `live` comes from the database, not the client clock: it is how open
  // players and banners learn that staff stopped the premiere early.
  return NextResponse.json({ count, live });
}
