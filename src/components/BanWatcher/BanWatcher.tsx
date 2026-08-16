"use client";

import { useEffect } from "react";

const POLL_INTERVAL_MS = 15000;

// Polls whether the current session just got banned, so an admin banning
// someone browsing right now redirects them to the ban page within
// ~15s instead of waiting for their next natural navigation.
export default function BanWatcher() {
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();
        if (data?.user?.banned) window.location.reload();
      } catch {
        // Network hiccup — try again next tick.
      }
    };

    const id = setInterval(check, POLL_INTERVAL_MS);

    // Background tabs get their setInterval throttled by the browser
    // (sometimes to 60s+), so also check immediately when the tab
    // regains focus instead of waiting for the next tick.
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", check);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", check);
    };
  }, []);

  return null;
}
