"use client";

import { useEffect, useRef, useState } from "react";
import type { Comment } from "@/db/queries";
import styles from "./FilmModal.module.css";

function formatRelativeTime(createdAt: string) {
  const date = new Date(createdAt.replace(" ", "T") + "Z");
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "à l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days} j`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `il y a ${weeks} sem.`;

  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function CommentItem({
  comment,
  currentUserId,
  canModerate,
  disabled,
  onReact,
  onDelete,
  onReply,
  replies,
  repliesByParent,
  creatorUserIds,
  isReply = false,
}: {
  comment: Comment;
  currentUserId: string | null;
  canModerate: boolean;
  disabled: boolean;
  onReact: (commentId: string, type: "up" | "down") => void;
  onDelete: (commentId: string) => void;
  onReply?: (parentId: string, body: string) => void;
  replies?: Comment[];
  repliesByParent?: Map<string, Comment[]>;
  creatorUserIds: string[];
  isReply?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const canDelete = comment.userId === currentUserId || canModerate;
  const isCreator = creatorUserIds.includes(comment.userId);

  useEffect(() => {
    if (!menuOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  const submitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !onReply) return;
    onReply(comment.id, replyText);
    setReplyText("");
    setReplying(false);
  };

  return (
    <div className={`${styles.comment} ${isReply ? styles.commentReply : ""}`}>
      <div className={styles.commentAvatar}>
        {comment.userAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={comment.userAvatarUrl} alt="" className={styles.commentAvatarImg} />
        ) : (
          <span className={styles.commentAvatarInitials}>{initials(comment.userName)}</span>
        )}
      </div>

      <div className={styles.commentMain}>
        <div className={styles.commentHeader}>
          <span className={styles.commentAuthor}>{comment.userName}</span>
          {isCreator && <span className={styles.creatorBadge}>Créateur</span>}
          <span className={styles.commentDate}>{formatRelativeTime(comment.createdAt)}</span>

          <div className={styles.commentReactions}>
            {currentUserId ? (
              <>
                <button
                  type="button"
                  className={`${styles.reactBtn} ${comment.myReaction === "up" ? styles.reactActiveUp : ""}`}
                  onClick={() => onReact(comment.id, "up")}
                  disabled={disabled}
                  aria-label="Pouce en haut"
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                    <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
                  </svg>
                  {comment.upCount > 0 && comment.upCount}
                </button>
                <button
                  type="button"
                  className={`${styles.reactBtn} ${comment.myReaction === "down" ? styles.reactActiveDown : ""}`}
                  onClick={() => onReact(comment.id, "down")}
                  disabled={disabled}
                  aria-label="Pouce en bas"
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                    <path d="M23 3h-4v12h4V3zM1 14c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.58-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2z" />
                  </svg>
                  {comment.downCount > 0 && comment.downCount}
                </button>
              </>
            ) : (
              (comment.upCount > 0 || comment.downCount > 0) && (
                <span className={styles.reactCounts}>
                  {comment.upCount > 0 && `+${comment.upCount}`}
                  {comment.upCount > 0 && comment.downCount > 0 && " · "}
                  {comment.downCount > 0 && `-${comment.downCount}`}
                </span>
              )
            )}

            {canDelete && (
              <div className={styles.commentMenu} ref={menuRef}>
                <button
                  type="button"
                  className={styles.commentMenuBtn}
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-label="Actions sur le commentaire"
                  aria-expanded={menuOpen}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <circle cx="5" cy="12" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="19" cy="12" r="2" />
                  </svg>
                </button>
                {menuOpen && (
                  <div className={styles.commentMenuDropdown}>
                    <button
                      type="button"
                      className={styles.commentMenuItem}
                      disabled={disabled}
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(comment.id);
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <p className={styles.commentBody}>{comment.body}</p>

        {onReply && currentUserId && (
          <button type="button" className={styles.replyToggle} onClick={() => setReplying((r) => !r)}>
            Répondre
          </button>
        )}

        {replying && (
          <form className={styles.replyForm} onSubmit={submitReply}>
            <textarea
              className={styles.replyInput}
              rows={2}
              placeholder={`Répondre à ${comment.userName}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              autoFocus
            />
            <div className={styles.replyFormActions}>
              <button type="button" className={styles.replyCancel} onClick={() => setReplying(false)}>
                Annuler
              </button>
              <button type="submit" className={styles.commentSubmit} disabled={disabled || !replyText.trim()}>
                Répondre
              </button>
            </div>
          </form>
        )}

        {replies && replies.length > 0 && (
          <div className={styles.repliesList}>
            {replies.map((r) => (
              <CommentItem
                key={r.id}
                comment={r}
                currentUserId={currentUserId}
                canModerate={canModerate}
                disabled={disabled}
                onReact={onReact}
                onDelete={onDelete}
                onReply={onReply}
                replies={repliesByParent?.get(r.id)}
                repliesByParent={repliesByParent}
                creatorUserIds={creatorUserIds}
                isReply
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
