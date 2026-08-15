"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./WelcomeMessage.module.css";

const WINDOW_MS = 2 * 24 * 60 * 60 * 1000;

export default function WelcomeMessage({ revealAt }: { revealAt: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const shownRef = useRef(false);

  useEffect(() => {
    if (!revealAt || pathname.startsWith("/admin")) return;

    const target = new Date(revealAt).getTime();
    const windowEnd = target + WINDOW_MS;

    const check = () => {
      const now = Date.now();
      if (now >= target && now <= windowEnd && !shownRef.current) {
        shownRef.current = true;
        setOpen(true);
      }
    };
    check();
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, [revealAt, pathname]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Message de N1wad</h2>
        <div className={styles.message}>
        <p>Voilà la plateforme officiel de streaming des Zorins.</p>
        <p>
          Avec l&apos;aide du goat Mauritz on a réalisé un site de streaming qui compile toutes les
          animations phares du stream comme par exemple &quot;Gueux Vs Noble&quot; (qui est pour
          l&apos;instant la seul chose disponible en intégralité sur le site).
        </p>
        <p>
          Le site est fait pour que vous puissiez profitez d&apos;un endroit où toutes les
          animations sont rassemblées pour pouvoir les regarder quand vous voulez mais aussi pour
          que vous puissiez partager les votre.
        </p>
        <p>
          Le site permet de s&apos;enregistrer en tant qu&apos;artiste pour partager ses animations
          (plus d&apos;une minutes) venant d&apos;un projet perso pour ceux qui peuvent être
          intéressé par le fait de faire une série. Vous pouvez aussi vous rassemblez afin de créer
          votre propre studio pour travailler en groupe. Il vous suffit de trouver un nom et
          d&apos;avoir l&apos;accord des participants. Chaque profil d&apos;artiste ou proposition
          de film/série sera vérifier par les staff, vous avez aussi un service contact en cas de
          problème ou de question, sinon vous pouvez aussi me mp.
        </p>
        <p>
          Comme dit précédemment seul Gueux Vs Noble est disponible pour le moment mais des
          productions sont déjà en cours d&apos;écriture des nouveautés devraient arriver et on
          attend aussi les vôtres.
        </p>
        <p>
          Chaque nouvel série/Film ou nouvel saison vous sera notifié avec un message dans ce post.
        </p>
        <p>
          Cliquez sur le bouton pour vous faire commencer à naviguer sur zoranim pour &quot;Créer. Rêver.
          Partager.&quot; tous ensemble.
        </p>
        <button type="button" className={styles.cta} onClick={() => setOpen(false)}>
          Créer. Rêver. Partager.
        </button>
        </div>
      </div>
    </div>
  );
}
