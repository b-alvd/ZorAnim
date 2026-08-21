"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Film } from "@/data/types";
import { getPremiereStatus } from "@/lib/premiere";
import ViewerCounter from "@/components/ViewerCounter/ViewerCounter";
import playerStyles from "@/components/VideoPlayer/VideoPlayer.module.css";
import styles from "./PremiereVideoPlayer.module.css";

function formatTimeFull(seconds: number) {
  if (!Number.isFinite(seconds)) return "00:00:00";
  const pad = (n: number) => Math.floor(n).toString().padStart(2, "0");
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// A stripped-down player used only for the live premiere window: no pause,
// no seek, no episode/suggestions side panel -- it's a live broadcast, not
// a normal on-demand watch, so none of that UI belongs here.
export default function PremiereVideoPlayer({ film }: { film: Film }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerIdRef = useRef<string>("");

  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [viewerCount, setViewerCount] = useState<number | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTime = () => setCurrent(video.currentTime);
    const onLoaded = () => setDuration(video.duration);
    const onEnded = () => {
      router.push("/");
      router.refresh();
    };
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("ended", onEnded);
    return () => {
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("ended", onEnded);
    };
  }, [router]);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    if (!viewerIdRef.current) {
      let id = sessionStorage.getItem("zoranim-viewer-id");
      if (!id) {
        id = crypto.randomUUID();
        sessionStorage.setItem("zoranim-viewer-id", id);
      }
      viewerIdRef.current = id;
    }
    let cancelled = false;
    const beat = async () => {
      try {
        const res = await fetch(`/api/watch/${film.id}/premiere-heartbeat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ viewerId: viewerIdRef.current }),
          cache: "no-store",
        });
        const data = await res.json();
        if (!cancelled && typeof data?.count === "number") setViewerCount(data.count);
      } catch {
        // Network hiccup — try again next tick.
      }
    };
    beat();
    const id = setInterval(beat, 10000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [film.id]);

  // Hard wall-clock cutoff: even if the file hasn't fired its own `ended`
  // event yet, cut playback the instant the scheduled live window closes.
  useEffect(() => {
    const id = setInterval(() => {
      if (getPremiereStatus(film) !== "preview") {
        videoRef.current?.pause();
        router.push("/");
        router.refresh();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [film, router]);

  const wakeControls = () => {
    setControlsVisible(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => setControlsVisible(false), 3000);
  };

  useEffect(() => {
    wakeControls();
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const v = Number(e.target.value);
    video.volume = v;
    video.muted = v === 0;
    setVolume(v);
    setMuted(v === 0);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    const video = videoRef.current as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
    if (!container || !video) return;
    if (typeof container.requestFullscreen !== "function") {
      video.webkitEnterFullscreen?.();
      return;
    }
    if (document.fullscreenElement) document.exitFullscreen();
    else container.requestFullscreen();
  };

  return (
    <div className={playerStyles.player} ref={containerRef} onMouseMove={wakeControls}>
      <video ref={videoRef} src={film.videoUrl} poster={film.poster} className={playerStyles.video} autoPlay muted={muted} playsInline />

      {viewerCount !== null && <ViewerCounter count={viewerCount} />}

      <button className={playerStyles.backBtn} onClick={() => router.push("/")} aria-label="Retour">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
      </button>

      <div className={styles.liveTag}>Avant-première en direct</div>

      <div className={`${playerStyles.controls} ${!controlsVisible ? playerStyles.controlsHidden : ""}`}>
        <div className={playerStyles.progressWrap}>
          <input type="range" min={0} max={duration || 0} value={current} disabled className={playerStyles.progress} readOnly />
          <span className={playerStyles.time}>
            {formatTimeFull(current)} sur {formatTimeFull(duration)}
          </span>
        </div>
        <div className={playerStyles.row}>
          <div className={playerStyles.rowLeft}>
            <div className={playerStyles.volumeGroup}>
              <button className={playerStyles.iconBtn} onClick={toggleMute} aria-label={muted ? "Réactiver le son" : "Couper le son"}>
                {muted || volume === 0 ? (
                  <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                    <path d="M16.5 12A4.5 4.5 0 0 0 14 8v2.2l2.45 2.45c.03-.21.05-.43.05-.65z" />
                    <path d="M19 12c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.94 8.94 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71z" />
                    <path d="M4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                    <path d="M3 9v6h4l5 5V4L7 9H3z" />
                    <path d="M16.5 12A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4z" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={changeVolume}
                className={playerStyles.volumeSlider}
                style={{ ["--pct" as string]: `${(muted ? 0 : volume) * 100}%` }}
                aria-label="Volume"
              />
            </div>
          </div>
          <div className={playerStyles.rowRight}>
            <button className={playerStyles.iconBtn} onClick={toggleFullscreen} aria-label="Plein écran">
              {fullscreen ? (
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M9 3H5a2 2 0 0 0-2 2v4M15 3h4a2 2 0 0 1 2 2v4M9 21H5a2 2 0 0 1-2-2v-4M15 21h4a2 2 0 0 0 2-2v-4" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M3 9V5a2 2 0 0 1 2-2h4M21 9V5a2 2 0 0 0-2-2h-4M3 15v4a2 2 0 0 0 2 2h4M21 15v4a2 2 0 0 1-2 2h-4" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
