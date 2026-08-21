import { NextResponse } from "next/server";
import { getPremiereViewerCount, heartbeatPremiereViewer } from "@/db/queries";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const count = await getPremiereViewerCount(id);
  return NextResponse.json({ count });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const viewerId = body?.viewerId;
  if (typeof viewerId !== "string" || !viewerId) {
    return NextResponse.json({ error: "invalid viewerId" }, { status: 400 });
  }
  const count = await heartbeatPremiereViewer(viewerId, id);
  return NextResponse.json({ count });
}
