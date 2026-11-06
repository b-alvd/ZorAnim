"use client";

import { useMemo, useState, useTransition } from "react";
import Dropdown from "@/components/Dropdown/Dropdown";
import AdminPager from "../AdminPager";
import { replyToContactMessageAction, setContactMessageStatusAction } from "./actions";
import { Avatar, CheckIcon, formatAgo, formatDay } from "../inbox-parts";
import { plural } from "../ContentList";
import type { ContactMessage } from "@/db/queries";
import list from "../films/films.module.css";
import styles from "../inbox.module.css";

const PAGE_SIZE = 6;
const STATUS_OPTIONS = ["À traiter", "Répondus", "Traités sans réponse", "Tous"];
const SORT_OPTIONS = ["Plus récents", "Plus anciens"];

function StatusPill({ status }: { status: string }) {
  if (status === "replied") return <span className={`${styles.status} ${styles.statusDone}`}>Répondu</span>;
  if (status === "closed") return <span className={`${styles.status} ${styles.statusRefused}`}>Traité</span>;
  return <span className={`${styles.status} ${styles.statusPending}`}>À traiter</span>;
}

function MessageCard({ message, now }: { message: ContactMessage; now: number }) {
  const [composing, setComposing] = useState(false);
  const [reply, setReply] = useState(message.adminReply ?? "");
  const [isPending, startTransition] = useTransition();
  const open = message.status === "open";

  return (
    <article className={`${styles.item} ${open ? styles.itemPending : ""}`}>
      <div className={styles.head}>
        <Avatar name={message.name} />
        <div className={styles.main}>
          <span className={styles.title}>{message.subject}</span>
          <span className={styles.meta}>
            <span>{message.name}</span>
            <a href={`mailto:${message.email}`}>{message.email}</a>
          </span>
        </div>
        <div className={styles.side}>
          <span className={styles.date} title={formatDay(message.createdAt)}>
            {formatAgo(message.createdAt, now)}
          </span>
          <StatusPill status={message.status} />
        </div>
      </div>

      <p className={styles.body}>{message.message}</p>

      {message.adminReply && !composing && (
        <div className={styles.quote}>
          <span className={styles.quoteLabel}>
            Ta réponse{message.repliedAt ? ` · ${formatAgo(message.repliedAt, now)}` : ""}
          </span>
          <p className={styles.body}>{message.adminReply}</p>
        </div>
      )}

      {composing ? (
        <div className={styles.composer}>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder={`Ta réponse à ${message.name}… La personne la verra dans son profil et recevra une notification.`}
            autoFocus
          />
          <div className={styles.actions}>
            <button type="button" className={styles.btn} onClick={() => setComposing(false)} disabled={isPending}>
              Annuler
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnAccept}`}
              disabled={isPending || !reply.trim()}
              onClick={() =>
                startTransition(async () => {
                  await replyToContactMessageAction(message.id, reply.trim());
                  setComposing(false);
                })
              }
            >
              {CheckIcon}
              {isPending ? "Envoi…" : "Envoyer"}
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.actions}>
          {message.status === "open" && (
            <button
              type="button"
              className={styles.btn}
              disabled={isPending}
              onClick={() => startTransition(() => setContactMessageStatusAction(message.id, "closed"))}
              title="Classer sans envoyer de réponse"
            >
              Marquer comme traité
            </button>
          )}
          {message.status === "closed" && (
            <button
              type="button"
              className={styles.btn}
              disabled={isPending}
              onClick={() => startTransition(() => setContactMessageStatusAction(message.id, "open"))}
            >
              Remettre à traiter
            </button>
          )}
          <button
            type="button"
            className={message.adminReply ? styles.btn : `${styles.btn} ${styles.btnAccept}`}
            onClick={() => setComposing(true)}
          >
            {message.adminReply ? "Modifier la réponse" : "Répondre"}
          </button>
        </div>
      )}
    </article>
  );
}

export default function MessagesManager({ messages, now }: { messages: ContactMessage[]; now: number }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(STATUS_OPTIONS[0]);
  const [sort, setSort] = useState(SORT_OPTIONS[0]);
  const [page, setPage] = useState(0);

  const counts = useMemo(
    () => ({
      open: messages.filter((m) => m.status === "open").length,
      replied: messages.filter((m) => m.status === "replied").length,
      closed: messages.filter((m) => m.status === "closed").length,
    }),
    [messages]
  );

  const needle = query.trim().toLowerCase();
  const visible = useMemo(() => {
    const wanted: Record<string, string | null> = {
      "À traiter": "open",
      Répondus: "replied",
      "Traités sans réponse": "closed",
      Tous: null,
    };
    const filtered = messages.filter((m) => {
      if (wanted[status] && m.status !== wanted[status]) return false;
      if (needle && ![m.name, m.email, m.subject, m.message].join(" ").toLowerCase().includes(needle)) return false;
      return true;
    });
    const dir = sort === "Plus anciens" ? 1 : -1;
    return filtered.sort((a, b) => dir * a.createdAt.localeCompare(b.createdAt));
  }, [messages, status, needle, sort]);

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
    { label: "À traiter", value: counts.open, accent: counts.open > 0 },
    { label: "Répondus", value: counts.replied },
    { label: "Traités sans réponse", value: counts.closed },
    { label: "Tous", value: messages.length },
  ];

  return (
    <div className={list.manager}>
      <div className={list.summary}>
        {chips.map((c) => (
          <button
            key={c.label}
            type="button"
            className={`${list.chip} ${c.accent ? list.chipAccent : ""}`}
            onClick={() => withReset(setStatus)(c.label)}
          >
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
            placeholder="Nom, email, sujet, contenu…"
            value={query}
            onChange={(e) => withReset(setQuery)(e.target.value)}
          />
        </div>
        <div className={list.filter}>
          <Dropdown options={STATUS_OPTIONS} value={status} onChange={withReset(setStatus)} />
        </div>
        <div className={list.filter}>
          <Dropdown options={SORT_OPTIONS} value={sort} onChange={withReset(setSort)} />
        </div>
      </div>

      <div className={list.resultsBar}>
        <span>{plural(visible.length, "message")}</span>
      </div>

      {pageItems.length === 0 ? (
        <p className={styles.empty}>
          {status === "À traiter" ? "Aucun message à traiter. Tout est à jour." : "Aucun message ne correspond."}
        </p>
      ) : (
        <div className={styles.list}>
          {pageItems.map((m) => (
            <MessageCard key={m.id} message={m} now={now} />
          ))}
        </div>
      )}

      <AdminPager page={current} pageCount={pageCount} onChange={setPage} />
    </div>
  );
}
