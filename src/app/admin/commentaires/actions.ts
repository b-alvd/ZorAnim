"use server";

import { revalidatePath } from "next/cache";
import { deleteComment } from "@/db/queries";

export async function deleteCommentAdminAction(commentId: string) {
  await deleteComment(commentId, "", true);
  revalidatePath("/admin/commentaires");
}
