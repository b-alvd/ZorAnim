"use client";

import { useRef, useState } from "react";
import styles from "./FileUpload.module.css";

function uploadWithProgress(
  url: string,
  formData: FormData,
  onProgress: (pct: number) => void
): Promise<{ secure_url?: string; duration?: number }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(data);
        else reject(data);
      } catch {
        reject(new Error("Réponse invalide."));
      }
    };
    xhr.onerror = () => reject(new Error("Erreur réseau."));
    xhr.send(formData);
  });
}

// Checks a pasted link actually loads as the expected media before accepting
// it, and reads a video's real length from its metadata -- the same value an
// upload gets from Cloudinary, which premieres rely on for the live window.
function probeMedia(url: string, kind: "video" | "image"): Promise<{ duration?: number }> {
  return new Promise((resolve, reject) => {
    if (kind === "image") {
      const img = new Image();
      img.onload = () => resolve({});
      img.onerror = () => reject(new Error("image"));
      img.src = url;
      return;
    }
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      resolve({ duration: Number.isFinite(video.duration) ? video.duration : undefined });
      video.removeAttribute("src");
      video.load();
    };
    video.onerror = () => reject(new Error("video"));
    video.src = url;
  });
}

// Cloudinary answers HEAD requests with the file size (and allows it
// cross-origin); anything that doesn't is just shown without a size.
async function fetchSize(url: string): Promise<number | null> {
  try {
    const res = await fetch(url, { method: "HEAD" });
    const length = Number(res.headers.get("content-length"));
    return res.ok && length > 0 ? length : null;
  } catch {
    return null;
  }
}

function formatDuration(seconds: number): string {
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = (total % 60).toString().padStart(2, "0");
  return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s}` : `${m}:${s}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1_000_000) return `${Math.round(bytes / 1000)} Ko`;
  return `${(bytes / 1_000_000).toFixed(1)} Mo`;
}

export default function FileUpload({
  name,
  label,
  accept,
  value,
  onChange,
  onDurationChange,
  maxSizeMB = 10,
  preview = false,
  allowUrl = false,
}: {
  name: string;
  label: string;
  accept: string;
  value: string;
  onChange: (url: string) => void;
  onDurationChange?: (seconds: number) => void;
  maxSizeMB?: number;
  preview?: boolean;
  // Staff-only: also accept a direct link to a file already hosted on a CDN.
  allowUrl?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number | null } | null>(null);
  // Shown next to the preview; also filled from the preview video itself when
  // editing an existing entry, so it never needs a fresh upload to appear.
  const [duration, setDuration] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [checkingUrl, setCheckingUrl] = useState(false);
  const kind = accept.startsWith("video") ? "video" : "image";

  const handleUrl = async () => {
    const url = urlInput.trim();
    setError(null);
    if (!/^https:\/\/\S+$/i.test(url)) {
      setError("Le lien doit commencer par https://");
      return;
    }
    setCheckingUrl(true);
    try {
      const { duration: probed } = await probeMedia(url, kind);
      setFileMeta({ name: decodeURIComponent(url.split("/").pop() ?? ""), size: await fetchSize(url) });
      setDuration(probed ?? null);
      onChange(url);
      if (typeof probed === "number") onDurationChange?.(probed);
      setUrlInput("");
      setStatus("idle");
    } catch {
      setError(
        kind === "video"
          ? "Impossible de lire cette vidéo : vérifie que le lien pointe directement vers le fichier (.mp4, .webm…)."
          : "Impossible de charger cette image : vérifie que le lien pointe directement vers le fichier."
      );
    } finally {
      setCheckingUrl(false);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);

    if (file.size > maxSizeMB * 1_000_000) {
      setStatus("error");
      setError(`Fichier trop lourd (${maxSizeMB} Mo max).`);
      return;
    }

    setStatus("uploading");
    setProgress(0);
    setFileMeta({ name: file.name, size: file.size });

    try {
      const signRes = await fetch("/api/upload", { method: "POST" });
      const signed = await signRes.json();
      if (!signRes.ok) {
        setStatus("error");
        setError(signed.error ?? "Échec de la préparation de l'envoi.");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signed.apiKey);
      formData.append("timestamp", String(signed.timestamp));
      formData.append("signature", signed.signature);
      formData.append("folder", signed.folder);

      const uploadData = await uploadWithProgress(signed.uploadUrl, formData, setProgress);
      if (!uploadData.secure_url) {
        setStatus("error");
        setError("Échec de l'envoi du fichier.");
        return;
      }

      onChange(uploadData.secure_url);
      if (typeof uploadData.duration === "number") {
        setDuration(uploadData.duration);
        onDurationChange?.(uploadData.duration);
      }
      setStatus("idle");
    } catch {
      setStatus("error");
      setError("Impossible de contacter le serveur.");
    }
  };

  const handleRemove = () => {
    onChange("");
    setFileMeta(null);
    setDuration(null);
    setStatus("idle");
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const displayName = fileMeta?.name ?? (value ? decodeURIComponent(value.split("/").pop() ?? "") : "");

  return (
    <div className={styles.wrap}>
      <input type="hidden" name={name} value={value} />
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className={styles.hiddenInput}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {status === "uploading" ? (
        <div className={styles.progressBox}>
          <div className={styles.progressHeader}>
            <span className={styles.filename}>{displayName}</span>
            <span className={styles.percent}>{progress}%</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : value ? (
        <div className={styles.doneBox}>
          {kind === "video" ? (
            // First frame as a thumbnail; plays muted while hovered so you can
            // check it's the right file without leaving the form.
            <div className={`${styles.preview} ${styles.previewVideo}`}>
              <video
                src={`${value}#t=0.5`}
                className={styles.previewImg}
                preload="metadata"
                muted
                playsInline
                loop
                onLoadedMetadata={(e) => {
                  const d = e.currentTarget.duration;
                  if (Number.isFinite(d)) setDuration((prev) => prev ?? d);
                }}
                onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                onMouseLeave={(e) => e.currentTarget.pause()}
              />
            </div>
          ) : (
            preview && (
              <div className={styles.preview}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={value} alt="" className={styles.previewImg} />
              </div>
            )
          )}
          <div className={styles.doneInfo}>
            <span className={styles.filename}>{displayName}</span>
            {(fileMeta?.size || duration !== null) && (
              <span className={styles.filesize}>
                {[fileMeta?.size ? formatBytes(fileMeta.size) : null, duration !== null ? formatDuration(duration) : null]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            )}
          </div>
          <button type="button" className={styles.replaceBtn} onClick={() => inputRef.current?.click()}>
            Remplacer
          </button>
          <button type="button" className={styles.removeBtn} onClick={handleRemove} aria-label="Supprimer le fichier">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={`${styles.dropzone} ${dragOver ? styles.dropzoneOver : ""}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 16V4" />
            <path d="M6 10l6-6 6 6" />
            <path d="M4 20h16" />
          </svg>
          <span>{label}</span>
          <span className={styles.dropzoneHint}>Clique ou glisse un fichier ici</span>
        </button>
      )}


      {allowUrl && !value && status !== "uploading" && (
        <div className={styles.urlRow}>
          <input
            type="url"
            className={styles.urlInput}
            placeholder="ou colle un lien direct (https://…)"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              // Enter would submit the whole film form instead.
              if (e.key === "Enter") {
                e.preventDefault();
                handleUrl();
              }
            }}
          />
          <button
            type="button"
            className={styles.replaceBtn}
            onClick={handleUrl}
            disabled={checkingUrl || !urlInput.trim()}
          >
            {checkingUrl ? "Vérification…" : "Utiliser ce lien"}
          </button>
        </div>
      )}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
