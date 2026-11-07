"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./HelpCenter.module.css";

// Horizontal tab bar that brings the active tab into view on narrow screens,
// where the bar scrolls sideways.
export default function HelpTabs({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = ref.current;
    const active = nav?.querySelector<HTMLElement>("[aria-current='page']");
    if (!nav || !active || nav.scrollWidth <= nav.clientWidth) return;
    nav.scrollLeft = active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2;
  }, []);

  return (
    <nav ref={ref} className={styles.tabs} aria-label="Pages d'aide">
      {children}
    </nav>
  );
}
