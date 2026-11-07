"use client";

import { useState } from "react";
import styles from "./Landing.module.css";

// N1wad's welcome message, as a letter: the start is shown, the rest unfolds
// with "Lire la suite".
export default function FounderNote() {
  const [open, setOpen] = useState(false);

  return (
    <section className={styles.block}>
      <article className={styles.note}>
        <span className={styles.noteQuote} aria-hidden>
          “
        </span>
        <span className={styles.kicker}>Le mot de N1wad</span>
        <h2 className={styles.noteTitle}>Voici la plateforme officielle de streaming des Zorins.</h2>

        <div className={`${styles.noteText} ${open ? styles.noteTextOpen : ""}`} id="founder-note">
          <p>
            Avec l&apos;aide du goat Mauritz (b_alvd), on a réalisé un site de streaming qui compile toutes les
            animations phares du stream, comme par exemple &quot;Gueux Vs Noble&quot; (qui est pour
            l&apos;instant la seule chose disponible en intégralité sur le site).
          </p>
          <p>
            Le site est fait pour que vous puissiez profiter d&apos;un endroit où toutes les animations sont
            rassemblées, afin de pouvoir les regarder quand vous voulez, mais aussi pour que vous puissiez
            partager les vôtres.
          </p>
          <p>
            Le site permet de s&apos;enregistrer en tant qu&apos;artiste pour partager ses animations (plus
            d&apos;une minute) issues d&apos;un projet perso, pour ceux qui seraient intéressés par l&apos;idée
            d&apos;en faire une série. Vous pouvez aussi vous rassembler pour créer votre propre studio et
            travailler en groupe : il vous suffit de trouver un nom et d&apos;avoir l&apos;accord des
            participants. Chaque profil d&apos;artiste ou proposition de film/série est vérifié par le staff.
            Vous disposez aussi d&apos;un service contact en cas de problème ou de question, ou vous pouvez aussi
            me mp directement ou mp Mauritz (b_alvd) si c&apos;est à des fins techniques.
          </p>
          <p>
            Comme dit précédemment, seul Gueux Vs Noble est disponible pour le moment, mais des productions sont
            déjà en cours d&apos;écriture. De nouveaux contenus devraient arriver, et on attend aussi les vôtres.
          </p>
          <p>Vous pourrez trouver les nouvelles et prochaines sorties, directement sur le catalogue.</p>
        </div>

        <div className={styles.noteFoot}>
          <span className={styles.noteSign}>
            <span className={styles.noteAvatar} aria-hidden>
              N
            </span>
            N1wad
          </span>
          <button
            type="button"
            className={styles.noteMore}
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="founder-note"
          >
            {open ? "Réduire" : "Lire la suite"}
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
              className={open ? styles.noteChevronOpen : ""}
              aria-hidden
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
      </article>
    </section>
  );
}
