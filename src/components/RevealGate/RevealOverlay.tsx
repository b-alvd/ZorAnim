"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo/Logo";
import styles from "./RevealGate.module.css";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

const BYPASS_PREFIXES = ["/admin", "/connexion"];

const FLOATERS = [
  { top: "12%", left: "8%", size: 46, dur: "16s", delay: "0s", dx: "140px", dy: "-90px", rot: "25deg" },
  { top: "72%", left: "14%", size: 34, dur: "13s", delay: "-4s", dx: "-110px", dy: "100px", rot: "-20deg" },
  { top: "22%", left: "82%", size: 40, dur: "19s", delay: "-9s", dx: "-130px", dy: "80px", rot: "30deg" },
  { top: "80%", left: "78%", size: 30, dur: "14s", delay: "-2s", dx: "95px", dy: "-120px", rot: "-28deg" },
  { top: "8%", left: "46%", size: 26, dur: "12s", delay: "-7s", dx: "80px", dy: "100px", rot: "22deg" },
  { top: "90%", left: "48%", size: 36, dur: "17s", delay: "-12s", dx: "-100px", dy: "-75px", rot: "-24deg" },
  { top: "45%", left: "4%", size: 24, dur: "13.5s", delay: "-5s", dx: "110px", dy: "70px", rot: "20deg" },
  { top: "40%", left: "92%", size: 28, dur: "15s", delay: "-10s", dx: "-90px", dy: "-100px", rot: "-22deg" },
];

export default function RevealOverlay({
  initialEnabled,
  revealAt,
  isAdmin,
}: {
  initialEnabled: boolean;
  revealAt: string | null;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const target = revealAt ? new Date(revealAt).getTime() : null;
  const initiallyLocked = initialEnabled && (!target || Date.now() < target);

  const [visible, setVisible] = useState(initiallyLocked);
  const [now, setNow] = useState(() => Date.now());
  const [revealing, setRevealing] = useState(false);
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [visible]);

  useEffect(() => {
    if (!visible || !target || triggeredRef.current) return;
    if (now >= target) {
      triggeredRef.current = true;
      setRevealing(true);
    }
  }, [now, target, visible]);

  // Own effect (deps: [revealing] only) so the ticking `now` state above can't
  // cancel this timeout mid-flight via the other effect's cleanup.
  useEffect(() => {
    if (!revealing) return;
    const t = setTimeout(() => setVisible(false), 1100);
    return () => clearTimeout(t);
  }, [revealing]);

  const bypassed =
    isAdmin || BYPASS_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const shown = !bypassed && visible;

  useEffect(() => {
    if (!shown) return;
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevOverflow;
    };
  }, [shown]);

  if (!shown) return null;

  const remaining = target !== null ? Math.max(0, target - now) : null;
  const days = remaining !== null ? Math.floor(remaining / 86400000) : 0;
  const hours = remaining !== null ? Math.floor((remaining % 86400000) / 3600000) : 0;
  const minutes = remaining !== null ? Math.floor((remaining % 3600000) / 60000) : 0;
  const seconds = remaining !== null ? Math.floor((remaining % 60000) / 1000) : 0;

  return (
    <div className={`${styles.wrap} ${revealing ? styles.revealing : ""}`}>
      <div className={styles.floaters}>
        {FLOATERS.map((f, i) => (
          <span
            key={i}
            className={styles.floater}
            style={
              {
                top: f.top,
                left: f.left,
                width: f.size,
                height: f.size,
                animationDuration: f.dur,
                animationDelay: f.delay,
                "--float-dx": f.dx,
                "--float-dy": f.dy,
                "--float-rot": f.rot,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
      <div className={styles.grain} />
      <div className={styles.frame} />
      <div className={styles.beam} />

      <div className={styles.content}>
        <div className={styles.logoWrap}>
          <Logo />
        </div>
        <div className={styles.rule} />

        {target !== null ? (
          <div className={styles.timer} aria-live="polite">
            {days > 0 && (
              <>
                <div className={styles.unit}>
                  <span className={styles.digits}>{pad(days)}</span>
                  <span className={styles.label}>Jours</span>
                </div>
                <span className={styles.colon}>:</span>
              </>
            )}
            <div className={styles.unit}>
              <span className={styles.digits}>{pad(hours)}</span>
              <span className={styles.label}>Heures</span>
            </div>
            <span className={styles.colon}>:</span>
            <div className={styles.unit}>
              <span className={styles.digits}>{pad(minutes)}</span>
              <span className={styles.label}>Min</span>
            </div>
            <span className={styles.colon}>:</span>
            <div className={styles.unit}>
              <span className={styles.digits}>{pad(seconds)}</span>
              <span className={styles.label}>Sec</span>
            </div>
          </div>
        ) : (
          <p className={styles.soon}>Très bientôt.</p>
        )}
      </div>

      <div className={styles.burst} />
    </div>
  );
}
