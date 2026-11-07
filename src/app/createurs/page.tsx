import Link from "next/link";
import ArtistCard from "@/components/ArtistCard/ArtistCard";
import { getArtists, getArtistStudios, getFilms, getStudios } from "@/db/queries";
import { countFilmsAndSeries, splitComingSoon } from "@/lib/series";
import styles from "./createurs.module.css";

// Artists and studios on one page, as two tabs (?type=studios).
export default async function CreateursPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const showStudios = type === "studios";

  const [allArtists, studios, allFilms] = await Promise.all([getArtists(), getStudios(), getFilms()]);
  const artists = allArtists.filter((a) => !a.isStudio);
  const films = splitComingSoon(allFilms).released;

  // An artist is credited with their own work and their studios' work.
  const artistCounts = await Promise.all(
    artists.map(async (a) => {
      const studioIds = new Set((await getArtistStudios(a.id)).map((s) => s.id));
      return countFilmsAndSeries(films.filter((f) => f.artistId === a.id || studioIds.has(f.artistId)));
    })
  );
  const studioCounts = studios.map((s) => countFilmsAndSeries(films.filter((f) => f.artistId === s.id)));

  const list = (showStudios ? studios : artists)
    .map((creator, i) => ({ creator, counts: (showStudios ? studioCounts : artistCounts)[i] }))
    .sort(
      (a, b) =>
        b.counts.filmCount + b.counts.seriesCount - (a.counts.filmCount + a.counts.seriesCount) ||
        a.creator.name.localeCompare(b.creator.name, "fr")
    );

  const tabs = [
    { href: "/createurs", label: "Artistes", count: artists.length, active: !showStudios },
    { href: "/createurs?type=studios", label: "Studios", count: studios.length, active: showStudios },
  ];

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Créateurs</h1>
        <p className={styles.subtitle}>
          Les artistes indépendants et les studios qui publient leurs animations sur ZorAnim.
        </p>
        <div className={styles.tabs} role="tablist">
          {tabs.map((t) => (
            <Link
              key={t.label}
              href={t.href}
              role="tab"
              aria-selected={t.active}
              className={`${styles.tab} ${t.active ? styles.tabActive : ""}`}
              scroll={false}
            >
              {t.label}
              <span className={styles.tabCount}>{t.count}</span>
            </Link>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <p className={styles.empty}>{showStudios ? "Aucun studio pour l'instant." : "Aucun artiste pour l'instant."}</p>
      ) : (
        <div className={styles.grid}>
          {list.map(({ creator, counts }) => (
            <ArtistCard
              key={creator.id}
              artist={creator}
              filmCount={counts.filmCount}
              seriesCount={counts.seriesCount}
            />
          ))}
        </div>
      )}

      <div className={styles.cta}>
        <div>
          <strong>Tu crées des animations ?</strong>
          <p>Publie tes films et séries sur ZorAnim, seul ou avec ton studio.</p>
        </div>
        <div className={styles.ctaActions}>
          <Link href="/devenir-artiste" className={styles.ctaPrimary}>
            Devenir artiste
          </Link>
          <Link href="/creer-un-studio" className={styles.ctaGhost}>
            Créer un studio
          </Link>
        </div>
      </div>
    </main>
  );
}
