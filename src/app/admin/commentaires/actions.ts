"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { deleteComment } from "@/db/queries";

export async function deleteCommentAdminAction(commentId: string) {
  await requireAdmin();
  await deleteComment(commentId, "", true);
  revalidatePath("/admin/commentaires");
}
