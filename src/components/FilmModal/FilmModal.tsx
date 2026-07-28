"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Film } from "@/data/types";
import type { Comment } from "@/db/queries";
import {
  addCommentAction,
  deleteCommentAction,
  getFilmSocialDataAction,
  rateFilmAction,
  toggleCommentReactionAction,
  toggleFavoriteAction,
} from "@/lib/actions";
import StarRating from "@/components/StarRating/StarRating";
import CommentItem from "./CommentItem";
import styles from "./FilmModal.module.css";

const ANIM_MS = 250;

export default function FilmModal({
  film,
  onClose,
  isFavorite = false,
}: {
  film: Film;
  onClose: () => void;
  isFavorite?: boolean;
}) {
  const [shown, setShown] = useState(false);
  const [favorite, setFavorite] = useState(isFavorite);
  const [isPending, startTransition] = useTransition();

  const [comments, setComments] = useState<Comment[]>([]);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [canModerate, setCanModerate] = useState(false);
  const [creatorUserIds, setCreatorUserIds] = useState<string[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isRating, startRating] = useTransition();
  const [isCommenting, startCommenting] = useTransition();

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    getFilmSocialDataAction(film.id).then((data) => {
      setComments(data.comments);
      setUserRating(data.userRating);
      setCurrentUserId(data.currentUserId);
      setCanModerate(data.canModerate);
      setCreatorUserIds(data.creatorUserIds);
    });
  }, [film.id]);

  const requestClose = () => {
    setShown(false);
    setTimeout(onClose, ANIM_MS);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleFavorite = () => {
    startTransition(async () => {
      const result = await toggleFavoriteAction(film.id);
      setFavorite(result);
    });
  };

  const handleRate = (value: number) => {
    setUserRating(value);
    startRating(() => rateFilmAction(film.id, value));
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    startCommenting(async () => {
      const updated = await addCommentAction(film.id, commentText);
      setComments(updated);
      setCommentText("");
    });
  };

  const handleReplyToComment = (parentId: string, body: string) => {
    startCommenting(async () => {
      const updated = await addCommentAction(film.id, body, parentId);
      setComments(updated);
    });
  };

  const handleDeleteComment = (commentId: string) => {
    startCommenting(async () => {
      const updated = await deleteCommentAction(commentId, film.id);
      setComments(updated);
    });
  };

  const handleReactComment = (commentId: string, type: "up" | "down") => {
    startCommenting(async () => {
      const updated = await toggleCommentReactionAction(commentId, film.id, type);
      setComments(updated);
    });
  };

  const topLevelComments = comments.filter((c) => !c.parentId);
  const repliesByParent = new Map<string, Comment[]>();
  for (const c of comments) {
    if (c.parentId) {
      const arr = repliesByParent.get(c.parentId) ?? [];
      arr.push(c);
      repliesByParent.set(c.parentId, arr);
    }
  }
  for (const arr of repliesByParent.values()) {
    arr.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  return (
    <div className={`${styles.overlay} ${shown ? styles.shown : ""}`} onClick={requestClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={requestClose} aria-label="Fermer">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12" />
            <path d="M18 6L6 18" />
          </svg>
        </button>
        <div className={styles.banner}>
          <Image src={film.poster} alt={film.title} fill sizes="700px" className={styles.bannerImg} unoptimized />
          <div className={styles.bannerShade} />
        </div>
        <div className={styles.body}>
          <h2 className={styles.title}>{film.title}</h2>
          <Link href={`/artistes/${film.artistId}`} className={styles.artist}>
            Par {film.artistName}
          </Link>
          <div className={styles.badges}>
            {film.isNew && <span className={`${styles.badge} ${styles.newBadge}`}>Nouveau</span>}
            <span className={styles.badge}>{film.year}</span>
            <span className={styles.badge}>{film.duration}</span>
            <span className={styles.badge}>{film.rating}</span>
          </div>

          <div className={styles.ratingRow}>
            <StarRating value={film.avgRating ?? 0} readOnly />
            <span className={styles.ratingMeta}>
              {film.ratingCount > 0
                ? `${film.avgRating!.toFixed(1)} (${film.ratingCount} avis)`
                : "Aucune note pour l'instant"}
            </span>
          </div>

          <p className={styles.synopsis}>{film.synopsis}</p>
          <div className={styles.actions}>
            <Link href={`/watch/${film.id}?autoplay=1`} className={styles.playBtn}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              Lecture
            </Link>
            <button
              type="button"
              className={`${styles.favBtn} ${favorite ? styles.favActive : ""}`}
              onClick={handleToggleFavorite}
              disabled={isPending}
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill={favorite ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {favorite ? "Dans ma liste" : "Ajouter à ma liste"}
            </button>
          </div>

          <div className={styles.myRating}>
            <span className={styles.myRatingLabel}>Ta note</span>
            <StarRating value={userRating ?? 0} onRate={handleRate} readOnly={isRating} />
          </div>

          <div className={styles.commentsSection}>
            <h3 className={styles.commentsTitle}>
              Commentaires {comments.length > 0 && `(${comments.length})`}
            </h3>

            <form className={styles.commentForm} onSubmit={handleAddComment}>
              <textarea
                className={styles.commentInput}
                rows={2}
                placeholder="Ton avis sur ce film..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button type="submit" className={styles.commentSubmit} disabled={isCommenting || !commentText.trim()}>
                Publier
              </button>
            </form>
            <div className={styles.commentsList}>
              {topLevelComments.map((c) => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  currentUserId={currentUserId}
                  canModerate={canModerate}
                  disabled={isCommenting}
                  onReact={handleReactComment}
                  onDelete={handleDeleteComment}
                  onReply={handleReplyToComment}
                  replies={repliesByParent.get(c.id)}
                  repliesByParent={repliesByParent}
                  creatorUserIds={creatorUserIds}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
