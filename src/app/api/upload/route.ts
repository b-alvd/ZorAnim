import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createUploadSignature } from "@/lib/storage";
import { isRateLimited } from "@/lib/rateLimit";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  if (isRateLimited(`upload:${user.id}`, 30, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Trop d'envois, réessaie dans quelques minutes." }, { status: 429 });
  }

  const signed = createUploadSignature(`zoranim/${user.id}`);
  return NextResponse.json(signed);
}
