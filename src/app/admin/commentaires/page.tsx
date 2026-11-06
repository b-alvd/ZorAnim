import { getAllCommentsWithStats } from "@/db/queries";
import CommentsManager from "./CommentsManager";
import styles from "../shared.module.css";

async function loadComments() {
  const comments = await getAllCommentsWithStats();
  // Reference time for relative dates, so server and browser render alike.
  return { comments, loadedAt: Date.now() };
}

export default async function AdminCommentairesPage() {
  const { comments, loadedAt } = await loadComments();

  return (
    <main>
      <div className={styles.header}>
        <h1 className={styles.title}>Commentaires</h1>
      </div>
      <CommentsManager comments={comments} now={loadedAt} />
    </main>
  );
}
