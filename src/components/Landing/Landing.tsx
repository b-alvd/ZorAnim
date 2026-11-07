import Image from "next/image";
import Link from "next/link";
import Row from "@/components/Row/Row";
import Shelf from "@/components/Row/Shelf";
import { CreatorChip } from "@/components/Card/ExtraCards";
import FounderNote from "./FounderNote";
import PatchNoteBubble from "@/components/PatchNoteBubble/PatchNoteBubble";
import PremiereBanner from "@/components/PremiereBanner/PremiereBanner";
import type { Artist, Film } from "@/data/types";
import type { SiteSettings } from "@/db/queries";
import type { CollapsedFilm } from "@/lib/series";
import styles from "./Landing.module.css";

// Posters per row of the moving wall behind the hero.
const WALL_ROW = 8;

const perks = [
  {
    title: "Regarde librement",
    text: "Tout le catalogue est ouvert, sans compte, sans pub et sans limite.",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
        <path d="M8 5v14l11-7z" />
      </svg>
    ),
  },
  {
    title: "Garde le fil",
    text: "Avec un compte gratuit : reprends là où tu t'étais arrêté, garde ta liste, note et commente.",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1z" />
      </svg>
    ),
  },
  {
    title: "Partage tes animations",
    text: "Deviens artiste ou monte un studio, et propose tes films et séries à l'équipe.",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 3l2.2 5.2L20 9l-4.4 3.8L17 18.5 12 15.6 7 18.5l1.4-5.7L4 9l5.8-.8z" />
      </svg>
    ),
  },
];

// Spreads the posters over the rows of the wall, repeating them when the
// catalogue is small so every row is full.
function wallRows(films: Film[], rows: number): string[][] {
  const posters = [...new Set(films.map((f) => f.poster).filter(Boolean))];
  if (posters.length === 0) return [];
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: WALL_ROW }, (_, i) => posters[(r * 3 + i) % posters.length])
  );
}

// Home page for visitors: a welcome hero over a wall of posters, then the
// same shelves as the signed-in home and a few words on what an account adds.
export default function Landing({
  allFilms,
  premiereAsHero = false,
  recent,
  comingSoon,
  topRated,
  creators,
  patchNote,
}: {
  allFilms: Film[];
  // An avant-première with a banner opens the page, above the welcome.
  premiereAsHero?: boolean;
  recent: CollapsedFilm[];
  comingSoon: CollapsedFilm[];
  topRated: CollapsedFilm[];
  creators: { creator: Artist; count: number }[];
  patchNote?: SiteSettings | null;
}) {
  // One h1 per page: the avant-première banner takes it when it opens the page.
  const WelcomeTitle = premiereAsHero ? "h2" : "h1";
  const wall = wallRows(recent.length ? recent : allFilms, 3);

  return (
    <main className={styles.page}>
      {premiereAsHero && <PremiereBanner films={allFilms} hero />}
      <section className={`${styles.hero} ${premiereAsHero ? styles.heroCompact : ""}`}>
        {wall.length > 0 && (
          <div className={styles.wall} aria-hidden>
            {wall.map((row, r) => (
              // Each row is doubled so the slide loops without a gap.
              <div key={r} className={`${styles.wallRow} ${r % 2 ? styles.wallRowReverse : ""}`}>
                {[...row, ...row].map((poster, i) => (
                  <span key={i} className={styles.wallTile}>
                    <Image src={poster} alt="" fill sizes="260px" unoptimized />
                  </span>
                ))}
              </div>
            ))}
          </div>
        )}
        <div className={styles.shade} />

        <div className={styles.heroContent}>
          <span className={styles.kicker}>La plateforme des Zorins</span>
          <WelcomeTitle className={styles.title}>Les animations des Zorins, au même endroit.</WelcomeTitle>
          <p className={styles.subtitle}>
            Films et séries d&apos;animation 2D et 3D, créés par la communauté. Gratuit, sans pub, et sans
            compte pour regarder.
          </p>
          <div className={styles.actions}>
            <Link href="/catalogue" className={styles.playBtn}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
              Parcourir le catalogue
            </Link>
            <Link href="/inscription" className={styles.ghostBtn}>
              Créer un compte
            </Link>
          </div>
          <p className={styles.login}>
            Déjà inscrit ? <Link href="/connexion">Se connecter</Link>
          </p>
        </div>
      </section>

      <div className={styles.shelves}>
        {!premiereAsHero && <PremiereBanner films={allFilms} />}
        {patchNote?.patchNoteEnabled && patchNote.patchNoteMessage?.trim() && (
          <PatchNoteBubble title={patchNote.patchNoteTitle} message={patchNote.patchNoteMessage} />
        )}

        <Row title="Ajoutés récemment" films={recent} href="/nouveautes" />
        <Row title="Bientôt sur ZorAnim" films={comingSoon} comingSoon href="/nouveautes" />
        <Row title="Les mieux notés" subtitle="Par la communauté" films={topRated} />

        <FounderNote />

        {creators.length > 0 && (
          <Shelf title="Créateurs à découvrir" href="/createurs" size="small">
            {creators.map(({ creator, count }) => (
              <CreatorChip
                key={creator.id}
                creator={creator}
                subtitle={`${creator.isStudio ? "Studio" : "Artiste"} · ${count} contenu${count > 1 ? "s" : ""}`}
              />
            ))}
          </Shelf>
        )}

        <section className={styles.block}>
          <h2 className={styles.blockTitle}>Ce que tu peux faire sur ZorAnim</h2>
          <div className={styles.perks}>
            {perks.map((p) => (
              <div key={p.title} className={styles.perk}>
                <span className={styles.perkIcon}>{p.icon}</span>
                <strong>{p.title}</strong>
                <p>{p.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.block}>
          <div className={styles.cta}>
            <div>
              <h2 className={styles.ctaTitle}>Crée ton compte, c&apos;est gratuit</h2>
              <p className={styles.ctaText}>Reprends tes programmes là où tu t&apos;étais arrêté, garde ta liste, note et commente.</p>
            </div>
            <div className={styles.ctaActions}>
              <Link href="/inscription" className={styles.redBtn}>
                Créer un compte
              </Link>
              <Link href="/connexion" className={styles.ghostBtn}>
                Se connecter
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
