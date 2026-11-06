"use client";

import { useMemo, useState } from "react";
import Dropdown from "@/components/Dropdown/Dropdown";
import AdminPager from "../AdminPager";
import { deleteCommentAdminAction } from "./actions";
import { Avatar, ConfirmButton, formatAgo, formatDay, parseDate } from "../inbox-parts";
import { plural } from "../ContentList";
import type { AdminComment } from "@/db/queries";
import list from "../films/films.module.css";
import styles from "../inbox.module.css";

const PAGE_SIZE = 6;
const DAY = 24 * 60 * 60 * 1000;
const ALL_CONTENTS = "Tous les contenus";
const PERIOD_OPTIONS = ["Toute période", "Dernières 24 h", "7 derniers jours", "30 derniers jours"];
const SORT_OPTIONS = ["Plus récents", "Plus anciens", "Plus de réactions", "Plus de 👎", "Plus de réponses"];

type Thread = { root: AdminComment; replies: { comment: AdminComment; depth: number }[] };

const ThumbUp = (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
    <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
  </svg>
);

const ThumbDown = (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
    <path d="M23 3h-4v12h4V3zM1 14c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.58-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2z" />
  </svg>
);

function contentLabel(c: AdminComment) {
  return c.episodeTag ? `${c.filmTitle} · ${c.episodeTag}` : c.filmTitle;
}

function DeleteButton({ comment, replyCount }: { comment: AdminComment; replyCount: number }) {
  return (
    <ConfirmButton
      label="Supprimer"
      className={`${styles.btn} ${styles.btnDanger}`}
      title="Supprimer le commentaire"
      text={
        <>
          Supprimer ce commentaire de <strong>{comment.userName}</strong>
          {replyCount > 0 ? ` et ses ${plural(replyCount, "réponse")}` : ""} ? Action irréversible.
        </>
      }
      confirmLabel="Supprimer"
      danger
      action={() => deleteCommentAdminAction(comment.id)}
    />
  );
}

function Reactions({ comment }: { comment: AdminComment }) {
  return (
    <>
      <span title="Réactions positives" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        {ThumbUp} {comment.upCount}
      </span>
      <span title="Réactions négatives" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        {ThumbDown} {comment.downCount}
      </span>
    </>
  );
}

function ThreadCard({ thread, now }: { thread: Thread; now: number }) {
  const [showReplies, setShowReplies] = useState(false);
  const { root, replies } = thread;

  return (
    <article className={styles.item}>
      <div className={styles.head}>
        <Avatar src={root.userAvatarUrl} name={root.userName} />
        <div className={styles.main}>
          <span className={styles.title}>{root.userName}</span>
          <span className={styles.meta}>
            <span>
              sur <strong>{root.filmTitle}</strong>
            </span>
            {root.episodeTag && (
              <span>
                <span className={styles.tag}>{root.episodeTag}</span> {root.episodeTitle}
              </span>
            )}
          </span>
        </div>
        <div className={styles.side}>
          <span className={styles.date} title={formatDay(root.createdAt)}>
            {formatAgo(root.createdAt, now)}
          </span>
        </div>
      </div>

      <p className={styles.body}>{root.body}</p>

      <div className={styles.footer}>
        <div className={styles.footerInfo}>
          <Reactions comment={root} />
          {replies.length > 0 && (
            <button type="button" className={styles.linkBtn} onClick={() => setShowReplies((v) => !v)}>
              {showReplies ? "Masquer" : "Voir"} {plural(replies.length, "réponse")}
            </button>
          )}
        </div>
        <div className={styles.actions}>
          <a className={styles.btn} href={`/watch/${root.filmId}`} target="_blank" rel="noreferrer">
            Voir le contenu
          </a>
          <DeleteButton comment={root} replyCount={replies.length} />
        </div>
      </div>

      {showReplies && (
        <div className={styles.replies}>
          {replies.map(({ comment, depth }) => (
            <div key={comment.id} className={styles.reply} style={{ marginLeft: Math.min(depth - 1, 3) * 16 }}>
              <Avatar src={comment.userAvatarUrl} name={comment.userName} />
              <div className={styles.main}>
                <span className={styles.meta}>
                  <strong style={{ color: "#e5e5e5" }}>{comment.userName}</strong>
                  <span title={formatDay(comment.createdAt)}>{formatAgo(comment.createdAt, now)}</span>
                  <Reactions comment={comment} />
                </span>
                <p className={styles.body}>{comment.body}</p>
              </div>
              <DeleteButton comment={comment} replyCount={0} />
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

export default function CommentsManager({ comments, now }: { comments: AdminComment[]; now: number }) {
  const [query, setQuery] = useState("");
  const [content, setContent] = useState(ALL_CONTENTS);
  const [period, setPeriod] = useState(PERIOD_OPTIONS[0]);
  const [sort, setSort] = useState(SORT_OPTIONS[0]);
  const [page, setPage] = useState(0);

  // Threads: each top-level comment with all its replies, depth-first.
  const threads = useMemo<Thread[]>(() => {
    const children = new Map<string, AdminComment[]>();
    for (const c of comments) {
      if (!c.parentId) continue;
      children.set(c.parentId, [...(children.get(c.parentId) ?? []), c]);
    }
    for (const arr of children.values()) arr.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const collect = (id: string, depth: number): Thread["replies"] =>
      (children.get(id) ?? []).flatMap((c) => [{ comment: c, depth }, ...collect(c.id, depth + 1)]);
    return comments.filter((c) => !c.parentId).map((root) => ({ root, replies: collect(root.id, 1) }));
  }, [comments]);

  const contents = useMemo(() => [...new Set(comments.map((c) => c.filmTitle))].sort((a, b) => a.localeCompare(b, "fr")), [comments]);

  const summary = useMemo(
    () => ({
      total: comments.length,
      replies: comments.filter((c) => c.parentId).length,
      week: comments.filter((c) => now - parseDate(c.createdAt).getTime() < 7 * DAY).length,
      contested: comments.filter((c) => c.downCount > c.upCount && c.downCount > 0).length,
    }),
    [comments, now]
  );

  const needle = query.trim().toLowerCase();
  const visible = useMemo(() => {
    const maxAge: Record<string, number> = {
      "Dernières 24 h": DAY,
      "7 derniers jours": 7 * DAY,
      "30 derniers jours": 30 * DAY,
    };
    const all = (t: Thread) => [t.root, ...t.replies.map((r) => r.comment)];
    const filtered = threads.filter((t) => {
      if (content !== ALL_CONTENTS && t.root.filmTitle !== content) return false;
      if (maxAge[period] && !all(t).some((c) => now - parseDate(c.createdAt).getTime() < maxAge[period])) return false;
      if (needle) {
        const haystack = all(t)
          .map((c) => `${c.body} ${c.userName} ${contentLabel(c)} ${c.episodeTitle ?? ""}`)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
    const latest = (t: Thread) => all(t).reduce((max, c) => (c.createdAt > max ? c.createdAt : max), "");
    const comparators: Record<string, (a: Thread, b: Thread) => number> = {
      "Plus anciens": (a, b) => a.root.createdAt.localeCompare(b.root.createdAt),
      "Plus de réactions": (a, b) => b.root.upCount + b.root.downCount - (a.root.upCount + a.root.downCount),
      "Plus de 👎": (a, b) => b.root.downCount - a.root.downCount,
      "Plus de réponses": (a, b) => b.replies.length - a.replies.length,
    };
    return filtered.sort(comparators[sort] ?? ((a, b) => latest(b).localeCompare(latest(a))));
  }, [threads, content, period, needle, sort, now]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const pageItems = visible.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  const withReset =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setPage(0);
    };

  const chips = [
    { label: "Commentaires", value: summary.total, onClick: () => (setPeriod(PERIOD_OPTIONS[0]), setPage(0)) },
    { label: "Réponses", value: summary.replies, onClick: () => undefined },
    { label: "Ces 7 derniers jours", value: summary.week, onClick: () => (setPeriod("7 derniers jours"), setPage(0)) },
    {
      key: "contested",
      label: (
        <span className={styles.chipIcons}>
          Plus de {ThumbDown} que de {ThumbUp}
        </span>
      ),
      value: summary.contested,
      onClick: () => (setSort("Plus de 👎"), setPage(0)),
    },
  ];

  return (
    <div className={list.manager}>
      <div className={list.summary}>
        {chips.map((c) => (
          <button key={"key" in c ? c.key : String(c.label)} type="button" className={list.chip} onClick={c.onClick}>
            <span className={list.chipValue}>{c.value}</span>
            <span className={list.chipLabel}>{c.label}</span>
          </button>
        ))}
      </div>

      <div className={list.toolbar}>
        <div className={list.search}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            type="search"
            placeholder="Texte, auteur, contenu…"
            value={query}
            onChange={(e) => withReset(setQuery)(e.target.value)}
          />
        </div>
        <div className={list.filter}>
          <Dropdown options={[ALL_CONTENTS, ...contents]} value={content} onChange={withReset(setContent)} />
        </div>
        <div className={list.filter}>
          <Dropdown options={PERIOD_OPTIONS} value={period} onChange={withReset(setPeriod)} />
        </div>
        <div className={list.filter}>
          <Dropdown options={SORT_OPTIONS} value={sort} onChange={withReset(setSort)} />
        </div>
      </div>

      <div className={list.resultsBar}>
        <span>{plural(visible.length, "fil")} de discussion</span>
      </div>

      {pageItems.length === 0 ? (
        <p className={styles.empty}>Aucun commentaire ne correspond.</p>
      ) : (
        <div className={styles.list}>
          {pageItems.map((t) => (
            <ThreadCard key={t.root.id} thread={t} now={now} />
          ))}
        </div>
      )}

      <AdminPager page={current} pageCount={pageCount} onChange={setPage} />
    </div>
  );
}
