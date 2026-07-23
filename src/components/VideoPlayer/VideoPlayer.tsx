"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { films, getArtist, type Film } from "@/data/mock";
import styles from "./VideoPlayer.module.css";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s}` : `${m}:${s}`;
}

export default function VideoPlayer({ film, autoplay = false }: { film: Film; autoplay?: boolean }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);

  const suggestions = films.filter((f) => f.id !== film.id).slice(0, 4);
  const artist = getArtist(film.artistId);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTime = () => setCurrent(video.currentTime);
    const onLoaded = () => setDuration(video.duration);
    const onPlay = () => {
      setPlaying(true);
      setStarted(true);
      setEnded(false);
    };
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      setEnded(true);
    };
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
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
    if (autoplay) videoRef.current?.play().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (!container) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else container.requestFullscreen();
  };

  const progressPct = duration ? (current / duration) * 100 : 0;
  const isPaused = !playing && !ended;

  return (
    <div className={styles.player} ref={containerRef}>
      <video
        ref={videoRef}
        src={film.videoUrl}
        poster={film.poster}
        className={styles.video}
        onClick={togglePlay}
        autoPlay={autoplay}
        playsInline
      />

      <button className={styles.backBtn} onClick={() => router.back()} aria-label="Retour">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
      </button>

      {isPaused && (
        <div className={styles.pauseOverlay}>
          <div className={styles.pauseShade} />
          <div className={styles.pauseInfo}>
            <div className={styles.posterWrap}>
              <Image src={film.poster} alt="" fill sizes="520px" className={styles.posterImg} unoptimized />
            </div>
            <h1 className={styles.pauseTitle}>{film.title}</h1>
            {artist && (
              <Link href={`/artistes/${artist.id}`} className={styles.pauseArtist}>
                Par {artist.name}
              </Link>
            )}
            <div className={styles.pauseBadges}>
              {film.isNew && <span className={`${styles.badge} ${styles.newBadge}`}>Nouveau</span>}
              <span className={styles.badge}>{film.year}</span>
              <span className={styles.badge}>{film.duration}</span>
              <span className={styles.badge}>{film.rating}</span>
            </div>
            <p className={styles.pauseSynopsis}>{film.synopsis}</p>
            <button className={styles.resumeBtn} onClick={togglePlay}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              {started ? "Reprendre la lecture" : "Démarrer la lecture"}
            </button>
          </div>
        </div>
      )}

      {ended && (
        <div className={styles.endedOverlay}>
          <div className={styles.endedTop}>
            <h2 className={styles.endedTitle}>Lecture terminée</h2>
            <button className={styles.replayBtn} onClick={replay}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12a8 8 0 1 0 2.34-5.66" />
                <path d="M4 4v5h5" />
              </svg>
              Revoir
            </button>
          </div>
          <p className={styles.endedSubtitle}>Quelques suggestions pour toi</p>
          <div className={styles.suggestions}>
            {suggestions.map((s) => (
              <Link key={s.id} href={`/watch/${s.id}`} className={styles.suggestionCard}>
                <div className={styles.suggestionPoster}>
                  <Image src={s.poster} alt={s.title} fill sizes="240px" unoptimized />
                </div>
                <span className={styles.suggestionTitle}>{s.title}</span>
                <div className={styles.suggestionBadges}>
                  <span className={styles.badge}>{s.year}</span>
                  <span className={styles.badge}>{s.duration}</span>
                  <span className={styles.badge}>{s.rating}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!isPaused && !ended && (
        <div className={styles.controls}>
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
