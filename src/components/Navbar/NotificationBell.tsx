"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import type { Notification } from "@/db/queries";
import { markAllNotificationsReadAction } from "@/lib/actions";
import styles from "./NotificationBell.module.css";

function formatRelativeTime(iso: string): string {
  const date = new Date(iso.replace(" ", "T") + "Z");
  const diffMs = Date.now() - date.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `il y a ${d}j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function NotificationBell({
  initialNotifications,
  initialUnreadCount,
}: {
  initialNotifications: Notification[];
  initialUnreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [notifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [, startTransition] = useTransition();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const handleToggle = () => {
    setOpen((o) => !o);
    if (!open && unreadCount > 0) {
      setUnreadCount(0);
      startTransition(() => {
        markAllNotificationsReadAction();
      });
    }
  };

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={`${styles.bellBtn} ${unreadCount > 0 ? styles.bellHasUnread : ""}`}
        onClick={handleToggle}
        aria-label="Notifications"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>Notifications</div>
          {notifications.length === 0 ? (
            <p className={styles.empty}>Aucune notification pour l&apos;instant.</p>
          ) : (
            <div className={styles.list}>
              {notifications.map((n) => {
                const content = (
                  <>
                    <p className={styles.message}>{n.message}</p>
                    <span className={styles.date}>{formatRelativeTime(n.createdAt)}</span>
                  </>
                );
                return n.link ? (
                  <Link key={n.id} href={n.link} className={`${styles.item} ${!n.read ? styles.itemUnread : ""}`} onClick={() => setOpen(false)}>
                    {content}
                  </Link>
                ) : (
                  <div key={n.id} className={`${styles.item} ${!n.read ? styles.itemUnread : ""}`}>
                    {content}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
