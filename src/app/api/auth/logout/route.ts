import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth/session";
import { getSessionCookie, clearSessionCookie } from "@/lib/auth/cookies";

export async function POST() {
  const sessionId = await getSessionCookie();
  if (sessionId) await deleteSession(sessionId);
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
