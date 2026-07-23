"use client";

import { useState } from "react";
import styles from "./Faq.module.css";

export type FaqItem = { question: string; answer: string };

export default function Faq({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className={styles.faq}>
      {items.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={item.question} className={`${styles.item} ${open ? styles.itemOpen : ""}`}>
            <button
              className={styles.question}
              onClick={() => setOpenIndex(open ? null : i)}
              aria-expanded={open}
            >
              {item.question}
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            <div className={`${styles.answerWrap} ${open ? styles.answerWrapOpen : ""}`}>
              <p className={styles.answer}>{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
