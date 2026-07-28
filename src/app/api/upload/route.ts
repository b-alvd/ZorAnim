import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createUploadSignature } from "@/lib/storage";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const signed = createUploadSignature(`zoranim/${user.id}`);
  return NextResponse.json(signed);
}
