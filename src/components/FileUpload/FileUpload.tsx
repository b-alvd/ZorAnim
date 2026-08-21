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
}: {
  name: string;
  label: string;
  accept: string;
  value: string;
  onChange: (url: string) => void;
  onDurationChange?: (seconds: number) => void;
  maxSizeMB?: number;
  preview?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);

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
      if (typeof uploadData.duration === "number") onDurationChange?.(uploadData.duration);
      setStatus("idle");
    } catch {
      setStatus("error");
      setError("Impossible de contacter le serveur.");
    }
  };

  const handleRemove = () => {
    onChange("");
    setFileMeta(null);
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
          {preview && (
            <div className={styles.preview}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value} alt="" className={styles.previewImg} />
            </div>
          )}
          <div className={styles.doneInfo}>
            <span className={styles.filename}>{displayName}</span>
            {fileMeta && <span className={styles.filesize}>{formatBytes(fileMeta.size)}</span>}
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

      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
