"use client";

import { useMemo, useState } from "react";
import ConfirmActionButton from "../ConfirmActionButton";
import { deleteCommentAdminAction } from "./actions";
import type { AdminComment } from "@/db/queries";
import styles from "./commentaires.module.css";

function formatDate(createdAt: string) {
  return new Date(createdAt.replace(" ", "T") + "Z").toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function CommentRow({
  comment,
  repliesByParent,
  depth = 0,
}: {
  comment: AdminComment;
  repliesByParent: Map<string, AdminComment[]>;
  depth?: number;
}) {
  const replies = repliesByParent.get(comment.id) ?? [];
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={styles.row} style={{ marginLeft: depth * 24 }}>
      <div className={styles.rowHeader}>
        {replies.length > 0 ? (
          <button type="button" className={styles.expandBtn} onClick={() => setExpanded((e) => !e)}>
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.15s ease" }}
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        ) : (
          <span className={styles.expandSpacer} />
        )}
        {depth > 0 && <span className={styles.replyTag}>Réponse</span>}
        <span className={styles.filmTitle}>{comment.filmTitle}</span>
        <span className={styles.author}>{comment.userName}</span>
        <span className={styles.date}>{formatDate(comment.createdAt)}</span>
        <div className={styles.stats}>
          <span className={styles.stat}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
              <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
            </svg>
            {comment.upCount}
          </span>
          <span className={styles.stat}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
              <path d="M23 3h-4v12h4V3zM1 14c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.58-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2z" />
            </svg>
            {comment.downCount}
          </span>
          {replies.length > 0 && <span className={styles.stat}>{replies.length} réponse{replies.length > 1 ? "s" : ""}</span>}
        </div>
        <ConfirmActionButton
          label="Supprimer"
          confirmTitle="Supprimer le commentaire"
          confirmText={`Supprimer ce commentaire de ${comment.userName} ?`}
          confirmLabel="Supprimer"
          variant="danger"
          action={deleteCommentAdminAction.bind(null, comment.id)}
        />
      </div>
      <p className={styles.body}>{comment.body}</p>

      {expanded && replies.length > 0 && (
        <div className={styles.replies}>
          {replies.map((r) => (
            <CommentRow key={r.id} comment={r} repliesByParent={repliesByParent} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentsList({ comments }: { comments: AdminComment[] }) {
  const { topLevel, repliesByParent } = useMemo(() => {
    const map = new Map<string, AdminComment[]>();
    for (const c of comments) {
      if (c.parentId) {
        const arr = map.get(c.parentId) ?? [];
        arr.push(c);
        map.set(c.parentId, arr);
      }
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }
    return { topLevel: comments.filter((c) => !c.parentId), repliesByParent: map };
  }, [comments]);

  if (topLevel.length === 0) {
    return <p className={styles.empty}>Aucun commentaire pour l&apos;instant.</p>;
  }

  return (
    <div className={styles.list}>
      {topLevel.map((c) => (
        <CommentRow key={c.id} comment={c} repliesByParent={repliesByParent} />
      ))}
    </div>
  );
}
