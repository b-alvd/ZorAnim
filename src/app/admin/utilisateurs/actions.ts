"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { banUser, deleteUser, resetUserPassword, unbanUser, updateUserRole } from "@/db/queries";
import { generateTemporaryPassword, hashPassword } from "@/lib/auth/password";

export async function toggleRoleAction(id: string, currentRole: string) {
  const me = await requireAdmin();
  if (me.id === id) throw new Error("Tu ne peux pas modifier ton propre rôle.");
  await updateUserRole(id, currentRole === "admin" ? "user" : "admin");
  revalidatePath("/admin/utilisateurs");
}

export async function deleteUserAction(id: string) {
  const me = await requireAdmin();
  if (me.id === id) throw new Error("Tu ne peux pas supprimer ton propre compte ici.");
  await deleteUser(id);
  revalidatePath("/admin/utilisateurs");
}

export async function banUserAction(id: string, reason: string) {
  const me = await requireAdmin();
  if (me.id === id) throw new Error("Tu ne peux pas te bannir toi-même.");
  await banUser(id, reason.trim() || null);
  revalidatePath("/admin/utilisateurs");
}

export async function unbanUserAction(id: string) {
  await requireAdmin();
  await unbanUser(id);
  revalidatePath("/admin/utilisateurs");
}

// Returns the temporary password so staff can pass it on. It is shown once
// in the admin and never stored in clear anywhere.
export async function resetPasswordAction(id: string): Promise<string> {
  const me = await requireAdmin();
  if (me.id === id) throw new Error("Change ton propre mot de passe depuis ton profil.");
  const temporaryPassword = generateTemporaryPassword();
  await resetUserPassword(id, await hashPassword(temporaryPassword));
  revalidatePath("/admin/utilisateurs");
  return temporaryPassword;
}
