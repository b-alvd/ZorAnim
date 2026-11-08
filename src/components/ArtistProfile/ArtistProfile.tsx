import Image from "next/image";
import Link from "next/link";
import Card from "@/components/Card/Card";
import type { Artist, Film } from "@/data/types";
import { getFilmEngagement, getSeriesEpisodeIds, getStudioTeamDisplay } from "@/db/queries";
import { collapseSeries, computeEffectiveWatchedIds, splitComingSoon, type CollapsedFilm } from "@/lib/series";
import styles from "./ArtistProfile.module.css";

type StudioLink = { id: string; name: string; avatar: string; isOwner: boolean };

function formatCount(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(".", ",")} k` : String(n);
}

function Avatar({ src, name, square }: { src?: string | null; name: string; square?: boolean }) {
  return (
    <span className={`${styles.chipAvatar} ${square ? styles.chipAvatarSquare : ""}`}>
      {src ? <Image src={src} alt="" fill sizes="48px" unoptimized /> : name.charAt(0).toUpperCase()}
    </span>
  );
}

function Grid({
  films,
  favoriteIds,
  watched,
  comingSoon,
  showStudio,
}: {
  films: CollapsedFilm[];
  favoriteIds: Set<string>;
  watched: Set<string>;
  comingSoon?: boolean;
  showStudio?: boolean;
}) {
  return (
    <div className={styles.grid}>
      {films.map((f) => (
        <div key={f.id} className={styles.slot}>
          <Card
            film={f}
            isFavorite={favoriteIds.has(f.id)}
            isWatched={watched.has(f.id)}
            episodeCount={f.episodeCount}
            comingSoon={comingSoon}
          />
          {showStudio && f.isStudioAttribution && (
            <Link href={`/studios/${f.artistId}`} className={styles.withStudio}>
              Avec {f.artistName}
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}

// Public page of an artist or a studio: header with stats, the people
// (studio team or artist's studios), then their films and series.
export default async function ArtistProfile({
  artist,
  artistFilms,
  favoriteIds,
  watchedIds,
  studios = [],
  joinButton,
  banner = null,
  portfolioUrl = null,
}: {
  artist: Artist;
  artistFilms: Film[];
  favoriteIds: Set<string>;
  watchedIds: Set<string>;
  studios?: StudioLink[];
  joinButton?: React.ReactNode;
  // Optional banner image; without it the blurred avatar tints the header.
  banner?: string | null;
  // Link to the creator's work elsewhere (site, ArtStation…).
  portfolioUrl?: string | null;
}) {
  const team = artist.isStudio ? await getStudioTeamDisplay(artist.id) : [];
  const { released, comingSoon } = splitComingSoon(artistFilms);
  const collapsed = collapseSeries(released);
  const upcoming = collapseSeries(comingSoon);
  const soloFilms = collapsed.filter((f) => !f.seriesTitle);
  const series = collapsed.filter((f) => f.seriesTitle);

  const seriesTitles = [...new Set(series.map((f) => f.seriesTitle!))];
  const [episodeIdsMap, engagement] = await Promise.all([
    getSeriesEpisodeIds(seriesTitles),
    getFilmEngagement(released.map((f) => f.id)),
  ]);
  const watched = computeEffectiveWatchedIds(collapsed, watchedIds, episodeIdsMap);

  const views = [...engagement.values()].reduce((sum, e) => sum + e.views, 0);
  const episodes = released.filter((f) => f.seriesTitle && f.episodeKind === "episode").length;
  const rated = collapsed.map((f) => f.avgRating).filter((r): r is number => r !== null);
  const avgRating = rated.length ? rated.reduce((a, b) => a + b, 0) / rated.length : null;

  const stats = [
    { value: String(soloFilms.length), label: soloFilms.length > 1 ? "Films" : "Film" },
    {
      value: String(series.length),
      label: series.length > 1 ? "Séries" : "Série",
      sub: series.length > 0 ? `${episodes} ép.` : undefined,
    },
    { value: formatCount(views), label: "Vues" },
    { value: avgRating === null ? "–" : avgRating.toFixed(1).replace(".", ","), label: "Note moyenne", star: true },
  ];

  const people = artist.isStudio
    ? team.map((m) => ({
        key: `${m.name}-${m.isOwner}`,
        name: m.name,
        avatar: m.avatar,
        href: m.artistId ? `/artistes/${m.artistId}` : null,
        role: m.isOwner ? "Fondateur" : "Membre",
        square: false,
      }))
    : studios.map((s) => ({
        key: s.id,
        name: s.name,
        avatar: s.avatar,
        href: `/studios/${s.id}`,
        role: s.isOwner ? "Fondateur" : "Membre",
        square: true,
      }));

  const empty = collapsed.length === 0 && upcoming.length === 0;

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        {banner ? (
          <div className={styles.banner} aria-hidden="true">
            <Image src={banner} alt="" fill sizes="100vw" priority unoptimized />
          </div>
        ) : (
          artist.avatar && (
            <div className={styles.heroBg} aria-hidden="true">
              <Image src={artist.avatar} alt="" fill sizes="100vw" unoptimized />
            </div>
          )
        )}
        <div className={`${styles.heroInner} ${banner ? styles.heroInnerBanner : ""}`}>
          <div className={`${styles.avatar} ${artist.isStudio ? styles.avatarSquare : ""}`}>
            {artist.avatar ? (
              <Image src={artist.avatar} alt={artist.name} fill sizes="140px" unoptimized />
            ) : (
              <span className={styles.initial}>{artist.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className={styles.identity}>
            <span className={styles.kind}>{artist.isStudio ? "Studio" : "Artiste"}</span>
            <h1 className={styles.name}>{artist.name}</h1>
            {artist.bio && <p className={styles.bio}>{artist.bio}</p>}
            {portfolioUrl && (
              <a href={portfolioUrl} target="_blank" rel="noopener noreferrer nofollow" className={styles.portfolio}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
                </svg>
                Portfolio
              </a>
            )}
            {joinButton && <div className={styles.join}>{joinButton}</div>}
          </div>
        </div>
        <div className={styles.stats}>
          {stats.map((s) => (
            <div key={s.label} className={styles.stat}>
              <span className={styles.statValue}>
                {s.star && s.value !== "–" && <span className={styles.star}>★</span>}
                {s.value}
              </span>
              <span className={styles.statLabel}>
                {s.label}
                {s.sub && <span className={styles.statSub}> · {s.sub}</span>}
              </span>
            </div>
          ))}
        </div>
      </header>

      <div className={styles.body}>
        {people.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {artist.isStudio ? "L'équipe" : people.length > 1 ? "Ses studios" : "Son studio"}
              <span className={styles.count}>{people.length}</span>
            </h2>
            <div className={styles.people}>
              {people.map((p) => {
                const inner = (
                  <>
                    <Avatar src={p.avatar} name={p.name} square={p.square} />
                    <span className={styles.personText}>
                      <span className={styles.personName}>{p.name}</span>
                      <span className={`${styles.role} ${p.role === "Fondateur" ? styles.roleOwner : ""}`}>{p.role}</span>
                    </span>
                  </>
                );
                return p.href ? (
                  <Link key={p.key} href={p.href} className={styles.person}>
                    {inner}
                  </Link>
                ) : (
                  <div key={p.key} className={styles.person}>
                    {inner}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {upcoming.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              Bientôt sur ZorAnim <span className={styles.count}>{upcoming.length}</span>
            </h2>
            <Grid films={upcoming} favoriteIds={favoriteIds} watched={watched} comingSoon />
          </section>
        )}

        {series.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              Séries <span className={styles.count}>{series.length}</span>
            </h2>
            <Grid films={series} favoriteIds={favoriteIds} watched={watched} showStudio={!artist.isStudio} />
          </section>
        )}

        {soloFilms.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              Films <span className={styles.count}>{soloFilms.length}</span>
            </h2>
            <Grid films={soloFilms} favoriteIds={favoriteIds} watched={watched} showStudio={!artist.isStudio} />
          </section>
        )}

        {empty && (
          <div className={styles.empty}>
            <p>{artist.name} n&apos;a encore rien publié sur ZorAnim.</p>
            <Link href="/createurs" className={styles.emptyLink}>
              Découvrir d&apos;autres créateurs
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
