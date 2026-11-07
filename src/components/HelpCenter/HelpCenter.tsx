import Link from "next/link";
import type { ReactNode } from "react";
import HelpTabs from "./HelpTabs";
import styles from "./HelpCenter.module.css";

export type HelpPage = "aide" | "contact" | "mises-a-jour" | "conditions" | "confidentialite";

const PAGES: { id: HelpPage; href: string; label: string; short?: string; icon: ReactNode }[] = [
  {
    id: "aide",
    href: "/aide",
    label: "Aide",
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6" />
        <circle cx="12" cy="17" r="0.6" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "contact",
    href: "/contact",
    label: "Contact",
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: "mises-a-jour",
    href: "/mises-a-jour",
    label: "Mises à jour",
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13 2 3 14h7l-1 8 11-14h-7l0-6z" />
      </svg>
    ),
  },
  {
    id: "conditions",
    href: "/conditions-utilisation",
    label: "Conditions d'utilisation",
    short: "Conditions",
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <path d="M14 3v6h6M8 13h8M8 17h5" />
      </svg>
    ),
  },
  {
    id: "confidentialite",
    href: "/confidentialite",
    label: "Confidentialité",
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z" />
      </svg>
    ),
  },
];

export type TocItem = { id: string; label: string };

// Shared layout of the help pages (aide, contact, mises à jour, legal
// pages): a header with tabs to move between them, then the content, with
// an optional table of contents on the side.
export default function HelpCenter({
  active,
  title,
  subtitle,
  updated,
  toc,
  children,
}: {
  active: HelpPage;
  title: string;
  subtitle: string;
  updated?: string;
  toc?: TocItem[];
  children: ReactNode;
}) {
  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.kicker}>Centre d&apos;aide</span>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
          {updated && <p className={styles.updated}>Dernière mise à jour : {updated}</p>}
        </div>
        <HelpTabs>
          {PAGES.map((p) => (
            <Link
              key={p.id}
              href={p.href}
              className={`${styles.tab} ${p.id === active ? styles.tabActive : ""}`}
              aria-current={p.id === active ? "page" : undefined}
            >
              {p.icon}
              {p.short ? (
                <>
                  <span className={styles.labelLong}>{p.label}</span>
                  <span className={styles.labelShort}>{p.short}</span>
                </>
              ) : (
                p.label
              )}
            </Link>
          ))}
        </HelpTabs>
      </header>

      <div className={`${styles.body} ${toc ? styles.withToc : ""}`}>
        {toc && (
          <aside className={styles.toc}>
            <span className={styles.tocTitle}>Sur cette page</span>
            <ol>
              {toc.map((t) => (
                <li key={t.id}>
                  <a href={`#${t.id}`}>{t.label}</a>
                </li>
              ))}
            </ol>
          </aside>
        )}
        <div className={styles.content}>{children}</div>
      </div>
    </main>
  );
}

// Numbered section of a legal page, anchored for the table of contents.
export function LegalSection({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={styles.legalSection}>
      <h2 className={styles.legalTitle}>
        <span className={styles.legalNumber}>{number}</span>
        {title}
      </h2>
      <div className={styles.prose}>{children}</div>
    </section>
  );
}

// "En bref" box summing up a legal page in a few points.
export function Summary({ items }: { items: string[] }) {
  return (
    <div className={styles.summary}>
      <span className={styles.summaryTitle}>En bref</span>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
