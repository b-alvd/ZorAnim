import { getAllCommentsWithStats } from "@/db/queries";
import CommentsList from "./CommentsList";
import styles from "../shared.module.css";

export default async function AdminCommentairesPage() {
  const allComments = await getAllCommentsWithStats();

  return (
    <main>
      <div className={styles.header}>
        <h1 className={styles.title}>Commentaires</h1>
      </div>
      <CommentsList comments={allComments} />
    </main>
  );
}
