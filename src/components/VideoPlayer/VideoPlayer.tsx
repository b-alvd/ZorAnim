"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Film } from "@/data/types";
import EndScreen from "./EndScreen";
import PauseScreen from "./PauseScreen";
import { episodeName, formatEpisodeTag } from "@/lib/series";
import { isFinished, MIN_RESUME_SECONDS } from "@/lib/watch-progress";
import { markProgressChanged } from "@/components/RefreshOnReturn/RefreshOnReturn";
import styles from "./VideoPlayer.module.css";

const DEFAULT_VOLUME = 0.5;

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s}` : `${m}:${s}`;
}

export default function VideoPlayer({
  film,
  suggestions,
  episodes = [],
  autoplay = false,
  resumeAt = 0,
  trackProgress = false,
  episodeProgress = {},
  lockedEpisodeIds = [],
}: {
  film: Film;
  suggestions: (Film & { episodeCount?: number })[];
  episodes?: Film[];
  autoplay?: boolean;
  // Where the user stopped last time (seconds); 0 to start from the beginning.
  resumeAt?: number;
  // Saves the playback position for "Reprendre" (signed-in users only).
  trackProgress?: boolean;
  // Per episode: absent = not watched, 0 = finished, > 0 = stopped there.
  episodeProgress?: Record<string, number>;
  // Episodes not released yet (premiere, scheduled release).
  lockedEpisodeIds?: string[];
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  // Sound on at half volume by default. If the browser refuses to autoplay
  // with sound, playback starts muted and a button offers to turn it on.
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [mutedByBrowser, setMutedByBrowser] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Position the playback was resumed from, shown for a few seconds.
  const [resumedFrom, setResumedFrom] = useState<number | null>(null);

  // ----- Playback position (Reprendre) -----
  // Only saved once the video has actually played, so opening a page and
  // leaving right away never wipes the previous stopping point.
  const playedRef = useRef(false);
  // Position sent by the last save (-1: nothing sent yet).
  const lastSavedRef = useRef(-1);
  // `ifChanged`: used when leaving, so an already saved state (e.g. a
  // finished episode) isn't sent again, which would wrongly make it the
  // latest activity in "Reprendre".
  const saveProgress = (opts: { ended?: boolean; beacon?: boolean; ifChanged?: boolean } = {}) => {
    const video = videoRef.current;
    if (!trackProgress || !video || !playedRef.current) return;
    if (opts.ifChanged && Math.abs(video.currentTime - lastSavedRef.current) < 1) return;
    lastSavedRef.current = video.currentTime;
    markProgressChanged();
    const url = `/api/watch/${film.id}/progress`;
    const body = JSON.stringify({
      position: opts.ended ? video.duration || video.currentTime : video.currentTime,
      duration: Number.isFinite(video.duration) ? video.duration : 0,
      ended: !!opts.ended,
    });
    if (opts.beacon && typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon(url, new Blob([body], { type: "text/plain" }));
    } else {
      fetch(url, { method: "POST", body, keepalive: true }).catch(() => {});
    }
  };
  const saveRef = useRef(saveProgress);
  useEffect(() => {
    saveRef.current = saveProgress;
  });

  // Saves when the page is hidden or left, and when this player goes away
  // (e.g. going to the next episode).
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") saveRef.current({ beacon: true, ifChanged: true });
    };
    const onPageHide = () => saveRef.current({ beacon: true, ifChanged: true });
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onPageHide);
      saveRef.current({ beacon: true, ifChanged: true });
    };
  }, []);

  // Jumps to the saved position once the video length is known.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || resumeAt < MIN_RESUME_SECONDS) return;
    const apply = () => {
      if (isFinished(resumeAt, video.duration)) return;
      video.currentTime = resumeAt;
      lastSavedRef.current = resumeAt;
      setResumedFrom(resumeAt);
    };
    if (video.readyState >= 1) apply();
    else video.addEventListener("loadedmetadata", apply, { once: true });
    return () => video.removeEventListener("loadedmetadata", apply);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resumedFrom === null) return;
    const id = setTimeout(() => setResumedFrom(null), 8000);
    return () => clearTimeout(id);
  }, [resumedFrom]);

  const restartFromBeginning = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    setResumedFrom(null);
    video.play().catch(() => {});
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTime = () => {
      setCurrent(video.currentTime);
      // Saved every 15 s of playback.
      if (!video.paused && Math.abs(video.currentTime - lastSavedRef.current) >= 15) saveRef.current();
    };
    const onLoaded = () => setDuration(video.duration);
    const onPlay = () => {
      playedRef.current = true;
      setPlaying(true);
      setStarted(true);
      setEnded(false);
    };
    const onPause = () => {
      setPlaying(false);
      if (!video.ended) saveRef.current();
    };
    const onEnded = () => {
      setPlaying(false);
      setEnded(true);
      saveRef.current({ ended: true });
    };
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
    // With autoplay, the video can load and start before these listeners
    // exist: catch up on what was missed.
    if (video.readyState >= 1) onLoaded();
    if (video.ended) {
      playedRef.current = true;
      onEnded();
    } else if (!video.paused) onPlay();
    return () => {
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
    };
  }, []);

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = DEFAULT_VOLUME;
    if (!autoplay) return;
    video.play().catch(() => {
      // Autoplay with sound blocked: start muted rather than not at all.
      video.muted = true;
      setMuted(true);
      setMutedByBrowser(true);
      video.play().catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enableSound = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    if (video.volume === 0) video.volume = DEFAULT_VOLUME;
    setMuted(false);
    setVolume(video.volume);
    setMutedByBrowser(false);
  };

  const wakeControls = () => {
    setControlsVisible(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => setControlsVisible(false), 3000);
  };

  useEffect(() => {
    // While paused the controls stay visible (see showControls).
    if (!playing) {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      return;
    }
    hideTimeoutRef.current = setTimeout(() => setControlsVisible(false), 3000);
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [playing]);
  const showControls = controlsVisible || !playing;

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
  };

  const replay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play();
  };

  const skip = (delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(Math.max(video.currentTime + delta, 0), duration || Infinity);
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const time = Number(e.target.value);
    video.currentTime = time;
    setCurrent(time);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    if (!video.muted && video.volume === 0) video.volume = DEFAULT_VOLUME;
    setMuted(video.muted);
    setVolume(video.volume);
    setMutedByBrowser(false);
  };

  const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const v = Number(e.target.value);
    video.volume = v;
    video.muted = v === 0;
    setVolume(v);
    setMuted(v === 0);
    setMutedByBrowser(false);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    const video = videoRef.current as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
    if (!container || !video) return;

    // iPhone Safari can't fullscreen an arbitrary element; only the
    // <video> itself supports it, via this native webkit-only API.
    if (typeof container.requestFullscreen !== "function") {
      video.webkitEnterFullscreen?.();
      return;
    }

    if (document.fullscreenElement) document.exitFullscreen();
    else container.requestFullscreen();
  };

  const progressPct = duration ? (current / duration) * 100 : 0;
  const isPaused = !playing && !ended;

  return (
    <div
      className={`${styles.player} ${!showControls ? styles.idle : ""}`}
      ref={containerRef}
      onMouseMove={wakeControls}
      onTouchStart={wakeControls}
    >
      <video
        ref={videoRef}
        src={film.videoUrl}
        poster={film.poster}
        className={styles.video}
        onClick={togglePlay}
        muted={muted}
        playsInline
      />

      <button
        className={`${styles.backBtn} ${!showControls ? styles.controlsHidden : ""}`}
        onClick={() => {
          // Sent before leaving so the page we go back to is up to date.
          saveProgress({ ifChanged: true });
          router.back();
        }}
        aria-label="Retour"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
      </button>

      {/* What is playing, next to the back arrow (the pause screen shows it otherwise). */}
      {!isPaused && !ended && (
        <>
          <div className={`${styles.topShade} ${!showControls ? styles.controlsHidden : ""}`} aria-hidden="true" />
          <div className={`${styles.nowPlaying} ${!showControls ? styles.controlsHidden : ""}`}>
            <span className={styles.nowPlayingTitle}>{film.seriesTitle ?? film.title}</span>
            <span className={styles.nowPlayingMeta}>
              {film.seriesTitle ? `${formatEpisodeTag(film)} · ${episodeName(film.title, film.seriesTitle)}` : `${film.year} · ${film.duration}`}
            </span>
          </div>
        </>
      )}

      {mutedByBrowser && !ended && (
        <button type="button" className={styles.soundNotice} onClick={enableSound}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3z" />
            <path d="M16.5 12A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4z" />
          </svg>
          Activer le son
        </button>
      )}

      {resumedFrom !== null && !ended && (
        <div className={styles.resumeNotice} role="status">
          <span>Reprise à {formatTime(resumedFrom)}</span>
          <button type="button" className={styles.resumeNoticeBtn} onClick={restartFromBeginning}>
            Reprendre du début
          </button>
        </div>
      )}

      {isPaused && (
        <PauseScreen
          film={film}
          episodes={episodes}
          episodeProgress={episodeProgress}
          lockedEpisodeIds={lockedEpisodeIds}
          current={current}
          duration={duration}
          started={started}
          onResume={togglePlay}
          onRestart={replay}
        />
      )}

      {ended && (
        <EndScreen
          film={film}
          episodes={episodes}
          episodeProgress={episodeProgress}
          lockedEpisodeIds={lockedEpisodeIds}
          suggestions={suggestions}
          onReplay={replay}
        />
      )}

      {!isPaused && !ended && (
        <div className={`${styles.controls} ${!showControls ? styles.controlsHidden : ""}`}>
          <div className={styles.progressWrap}>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={current}
              onChange={seek}
              className={styles.progress}
              style={{ ["--pct" as string]: `${progressPct}%` }}
            />
            <span className={styles.time}>
              {formatTime(current)} / {formatTime(duration)}
            </span>
          </div>
          <div className={styles.row}>
            <div className={styles.rowLeft}>
              <button className={styles.iconBtn} onClick={togglePlay} aria-label="Pause">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" />
                  <rect x="14" y="5" width="4" height="14" />
                </svg>
              </button>
              <button className={styles.iconBtn} onClick={() => skip(-10)} aria-label="Reculer de 10 secondes">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M4 12a8 8 0 1 0 2.34-5.66" />
                  <path d="M4 4v5h5" />
                </svg>
                <span className={styles.skipLabel}>10</span>
              </button>
              <button className={styles.iconBtn} onClick={() => skip(10)} aria-label="Avancer de 10 secondes">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M20 12a8 8 0 1 1-2.34-5.66" />
                  <path d="M20 4v5h-5" />
                </svg>
                <span className={styles.skipLabel}>10</span>
              </button>
              <div className={styles.volumeGroup}>
                <button className={styles.iconBtn} onClick={toggleMute} aria-label={muted ? "Réactiver le son" : "Couper le son"}>
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
                  className={styles.volumeSlider}
                  style={{ ["--pct" as string]: `${(muted ? 0 : volume) * 100}%` }}
                  aria-label="Volume"
                />
              </div>
            </div>
            <div className={styles.rowRight}>
              <button className={styles.iconBtn} onClick={toggleFullscreen} aria-label="Plein écran">
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
      )}
    </div>
  );
}
