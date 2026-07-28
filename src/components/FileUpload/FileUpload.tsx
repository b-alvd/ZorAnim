"use client";

import { useRef, useState } from "react";
import styles from "./FileUpload.module.css";

export default function FileUpload({
  name,
  label,
  accept,
  value,
  onChange,
  maxSizeMB = 8,
  preview = false,
}: {
  name: string;
  label: string;
  accept: string;
  value: string;
  onChange: (url: string) => void;
  maxSizeMB?: number;
  preview?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);

    if (file.size > maxSizeMB * 1_000_000) {
      setError(`Fichier trop lourd (${maxSizeMB} Mo max).`);
      return;
    }

    setUploading(true);
    try {
      const signRes = await fetch("/api/upload", { method: "POST" });
      const signed = await signRes.json();
      if (!signRes.ok) {
        setError(signed.error ?? "Échec de la préparation de l'envoi.");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signed.apiKey);
      formData.append("timestamp", String(signed.timestamp));
      formData.append("signature", signed.signature);
      formData.append("folder", signed.folder);

      const uploadRes = await fetch(signed.uploadUrl, { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.secure_url) {
        setError("Échec de l'envoi du fichier.");
        return;
      }

      onChange(uploadData.secure_url);
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <input type="hidden" name={name} value={value} />
      <div className={styles.row}>
        {preview && value && (
          <div className={styles.preview}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className={styles.previewImg} />
          </div>
        )}
        <button type="button" className={styles.uploadBtn} onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? "Envoi..." : value ? "Remplacer le fichier" : label}
        </button>
        {value && !uploading && (
          <span className={styles.filename}>{decodeURIComponent(value.split("/").pop() ?? "")}</span>
        )}
      </div>
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
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
