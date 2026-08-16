"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { banUser, deleteUser, unbanUser, updateUserRole } from "@/db/queries";

export async function toggleRoleAction(id: string, currentRole: string) {
  const me = await getCurrentUser();
  if (me?.id === id) throw new Error("Tu ne peux pas modifier ton propre rôle.");
  await updateUserRole(id, currentRole === "admin" ? "user" : "admin");
  revalidatePath("/admin/utilisateurs");
}

export async function deleteUserAction(id: string) {
  const me = await getCurrentUser();
  if (me?.id === id) throw new Error("Tu ne peux pas supprimer ton propre compte ici.");
  await deleteUser(id);
  revalidatePath("/admin/utilisateurs");
}

export async function banUserAction(id: string, reason: string) {
  const me = await getCurrentUser();
  if (me?.id === id) throw new Error("Tu ne peux pas te bannir toi-même.");
  await banUser(id, reason.trim() || null);
  revalidatePath("/admin/utilisateurs");
}

export async function unbanUserAction(id: string) {
  await unbanUser(id);
  revalidatePath("/admin/utilisateurs");
}
