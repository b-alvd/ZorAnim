"use client";

import { useMemo, useState } from "react";
import { matchesQuery } from "@/lib/search";
import styles from "./aide.module.css";

export type FaqGroup = { title: string; items: { question: string; answer: string }[] };

// Questions grouped by topic, with a search field filtering them live.
export default function HelpFaq({ groups }: { groups: FaqGroup[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      groups
        .map((g) => ({ ...g, items: g.items.filter((i) => matchesQuery(query, i.question, i.answer)) }))
        .filter((g) => g.items.length > 0),
    [groups, query]
  );

  return (
    <div className={styles.faq}>
      <div className={styles.search}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une question (compte, avant-première, studio…)"
          aria-label="Rechercher dans l'aide"
        />
      </div>

      {filtered.length === 0 ? (
        <p className={styles.noResult}>Aucune question ne correspond. Écris-nous, on te répond directement.</p>
      ) : (
        filtered.map((g) => (
          <section key={g.title} className={styles.group}>
            <h2 className={styles.groupTitle}>{g.title}</h2>
            <div className={styles.items}>
              {g.items.map((item) => {
                const isOpen = open === item.question || (!!query && filtered.length === 1 && g.items.length === 1);
                return (
                  <div key={item.question} className={`${styles.item} ${isOpen ? styles.itemOpen : ""}`}>
                    <button
                      type="button"
                      className={styles.question}
                      onClick={() => setOpen(isOpen ? null : item.question)}
                      aria-expanded={isOpen}
                    >
                      {item.question}
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                    {isOpen && <p className={styles.answer}>{item.answer}</p>}
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
