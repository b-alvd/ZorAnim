"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./profil.module.css";

const MAX_AVATAR_BYTES = 8_000_000;

export default function AvatarUpload({
  avatarUrl,
  initials,
}: {
  avatarUrl: string | null;
  initials: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(avatarUrl);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Choisis un fichier image.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError("Image trop lourde (8 Mo max).");
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

      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: uploadData.secure_url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Échec de l'enregistrement.");
        return;
      }
      setPreview(uploadData.secure_url);
      router.refresh();
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.avatarBlock}>
      <button
        type="button"
        className={styles.avatarBtn}
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        aria-label="Changer la photo de profil"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className={styles.avatarImg} />
        ) : (
          <span className={styles.avatarInitials}>{initials}</span>
        )}
        <span className={styles.avatarOverlay}>{uploading ? "..." : "Changer"}</span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className={styles.hiddenInput}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {error && <p className={styles.avatarError}>{error}</p>}
    </div>
  );
}
