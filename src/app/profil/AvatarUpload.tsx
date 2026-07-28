"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./profil.module.css";

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
    if (file.size > 1_500_000) {
      setError("Image trop lourde (1.5 Mo max).");
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    setUploading(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Échec de l'envoi.");
        return;
      }
      setPreview(dataUrl);
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
