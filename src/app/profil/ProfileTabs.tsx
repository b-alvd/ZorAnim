"use client";

import { useState, type ReactNode } from "react";
import styles from "./profil.module.css";

export type ProfileTab = { id: string; label: string; badge?: number; content: ReactNode };

// Tabs of the profile page. The panels are rendered on the server and passed
// in; the active tab is mirrored in ?onglet= so a link can open one directly.
export default function ProfileTabs({ tabs, initial }: { tabs: ProfileTab[]; initial: string }) {
  const [active, setActive] = useState(tabs.some((t) => t.id === initial) ? initial : tabs[0].id);

  const select = (id: string) => {
    setActive(id);
    const url = new URL(window.location.href);
    if (id === tabs[0].id) url.searchParams.delete("onglet");
    else url.searchParams.set("onglet", id);
    window.history.replaceState(null, "", url);
  };

  return (
    <>
      <div className={styles.tabs} role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.id === active}
            className={`${styles.tab} ${t.id === active ? styles.tabActive : ""}`}
            onClick={() => select(t.id)}
          >
            {t.label}
            {!!t.badge && <span className={styles.tabBadge}>{t.badge}</span>}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" hidden={t.id !== active} className={styles.panel}>
          {t.content}
        </div>
      ))}
    </>
  );
}
