"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const KEY = "zoranim:progress-changed";

// Called by the player whenever it saves a playback position.
export function markProgressChanged() {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    // Storage unavailable (private mode…): pages simply won't auto-refresh.
  }
}

function consumeProgressChanged(): boolean {
  try {
    if (sessionStorage.getItem(KEY) !== "1") return false;
    sessionStorage.removeItem(KEY);
    return true;
  } catch {
    return false;
  }
}

// Put on pages that show viewing progress ("Reprendre", Ma liste…). Coming
// back to them after watching (back button, history, cached page) shows a
// copy rendered before the playback; this refreshes it once when a position
// was saved meanwhile.
export default function RefreshOnReturn() {
  const router = useRouter();

  useEffect(() => {
    if (consumeProgressChanged()) router.refresh();
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted && consumeProgressChanged()) router.refresh();
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, [router]);

  return null;
}
