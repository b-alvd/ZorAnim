"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { banUser, deleteUser, resetUserPassword, unbanUser, updateUserRole } from "@/db/queries";
import { generateTemporaryPassword, hashPassword } from "@/lib/auth/password";

// Returned rather than thrown: Next.js hides thrown messages in production.
export type UserActionResult = { error?: string };

const errorOf = (e: unknown) => ({ error: e instanceof Error ? e.message : "Une erreur est survenue." });

export async function setRoleAction(id: string, role: "user" | "admin"): Promise<UserActionResult> {
  const me = await requireAdmin();
  if (me.id === id) return { error: "Tu ne peux pas modifier ton propre rôle." };
  try {
    await updateUserRole(id, role);
  } catch (e) {
    return errorOf(e);
  }
  revalidatePath("/admin/utilisateurs");
  return {};
}

export async function deleteUserAction(id: string): Promise<UserActionResult> {
  const me = await requireAdmin();
  if (me.id === id) return { error: "Tu ne peux pas supprimer ton propre compte ici." };
  try {
    await deleteUser(id);
  } catch (e) {
    return errorOf(e);
  }
  revalidatePath("/admin/utilisateurs");
  return {};
}

export async function banUserAction(id: string, reason: string): Promise<UserActionResult> {
  const me = await requireAdmin();
  if (me.id === id) return { error: "Tu ne peux pas te bannir toi-même." };
  try {
    await banUser(id, reason.trim() || null);
  } catch (e) {
    return errorOf(e);
  }
  revalidatePath("/admin/utilisateurs");
  return {};
}

export async function unbanUserAction(id: string): Promise<UserActionResult> {
  await requireAdmin();
  await unbanUser(id);
  revalidatePath("/admin/utilisateurs");
  return {};
}

// Returns the temporary password so staff can pass it on. It is shown once
// in the admin and never stored in clear anywhere.
export async function resetPasswordAction(id: string): Promise<{ password?: string; error?: string }> {
  const me = await requireAdmin();
  if (me.id === id) return { error: "Change ton propre mot de passe depuis ton profil." };
  const temporaryPassword = generateTemporaryPassword();
  try {
    await resetUserPassword(id, await hashPassword(temporaryPassword));
  } catch (e) {
    return errorOf(e);
  }
  revalidatePath("/admin/utilisateurs");
  return { password: temporaryPassword };
}
