import RefreshOnReturn from "@/components/RefreshOnReturn/RefreshOnReturn";
import Hero, { type HeroSlide } from "@/components/Hero/Hero";
import Row from "@/components/Row/Row";
import Shelf from "@/components/Row/Shelf";
import { ContinueCard, CreatorChip } from "@/components/Card/ExtraCards";
import Landing from "@/components/Landing/Landing";
import PatchNoteBubble from "@/components/PatchNoteBubble/PatchNoteBubble";
import PremiereBanner from "@/components/PremiereBanner/PremiereBanner";
import {
  getArtists,
  getFavoriteFilmIds,
  getFilmAddedDates,
  getFilms,
  getSiteSettings,
  getStudios,
  getWatchEntries,
} from "@/db/queries";
import type { Artist, Film } from "@/data/types";
import { getCurrentUser } from "@/lib/auth/current-user";
import { collapseSeries, splitComingSoon, type CollapsedFilm } from "@/lib/series";
import { sortByAdded } from "@/lib/recent";
import { pickFeaturedPremiere } from "@/lib/premiere";
import { getContinueItems, getSeriesProgress, type ContinueItem, type SeriesProgress } from "@/lib/progress";
import { MIN_RESUME_SECONDS } from "@/lib/watch-progress";
import styles from "./home.module.css";

const HERO_SLIDES = 5;
const ROW_SIZE = 12;
// A content needs this many ratings to enter "Les mieux notés".
const MIN_RATINGS_FOR_TOP = 1;

function watchedSet(collapsed: CollapsedFilm[], watchedAt: Map<string, string>, progress: Map<string, SeriesProgress>) {
  return collapsed
    .filter((f) => {
      if (!f.seriesTitle) return watchedAt.has(f.id);
      const p = progress.get(f.seriesTitle);
      return !!p && p.total > 0 && p.watched === p.total;
    })
    .map((f) => f.id);
}

// An avant-première with a banner image takes the top of the page (in place
// of the carousel, or above the visitors' welcome), so it is the first thing
// seen.
function hasPremiereHero(allFilms: Film[]) {
  const featured = pickFeaturedPremiere(allFilms);
  if (!featured) return false;
  const { film, phase } = featured;
  return !!(phase === "waiting" ? (film.releaseBanner ?? film.premiereBanner) : film.premiereBanner);
}

function topRatedOf(collapsed: CollapsedFilm[]) {
  return collapsed
    .filter((f) => f.ratingCount >= MIN_RATINGS_FOR_TOP && f.avgRating !== null)
    .sort((a, b) => b.avgRating! - a.avgRating! || b.ratingCount - a.ratingCount)
    .slice(0, ROW_SIZE);
}

// Creators with something to watch, the most prolific first.
function creatorsOf(collapsed: CollapsedFilm[], all: Artist[]) {
  const contentCount = (id: string) => collapsed.filter((f) => f.artistId === id).length;
  return all
    .map((c) => ({ creator: c, count: contentCount(c.id) }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);
}

// "Lecture" of a hero slide follows "Reprendre" when the content is in it.
function heroSlide(film: CollapsedFilm, continueBy: Map<string, ContinueItem>, kicker: string): HeroSlide {
  const item = continueBy.get(film.seriesTitle ?? film.id);
  if (!item) return { film, playId: film.id, playLabel: "Lecture", kicker };
  const tag = (f: Film) => (f.seriesTitle ? ` · S${f.seasonNumber ?? 1}E${f.episodeNumber ?? 1}` : "");
  const label = item.mode === "resume" ? "Reprendre" : item.mode === "next" ? "Épisode suivant" : "Lecture";
  return { film, playId: item.film.id, playLabel: `${label}${tag(item.film)}`, kicker };
}

export default async function Home() {
  const [user, allFilms, settings] = await Promise.all([getCurrentUser(), getFilms(), getSiteSettings()]);
  const { released: films, comingSoon: comingSoonFilms } = splitComingSoon(allFilms);
  const showPatchNote = settings.patchNoteEnabled && !!settings.patchNoteMessage?.trim();

  if (!user) {
    const [dates, artists, studios] = await Promise.all([getFilmAddedDates(), getArtists(), getStudios()]);
    const collapsed = collapseSeries(films);
    return (
      <Landing
        allFilms={allFilms}
        premiereAsHero={hasPremiereHero(allFilms)}
        recent={sortByAdded(collapsed, films, dates).slice(0, ROW_SIZE)}
        comingSoon={collapseSeries(comingSoonFilms)}
        topRated={topRatedOf(collapsed)}
        creators={creatorsOf(collapsed, [...artists, ...studios])}
        patchNote={showPatchNote ? settings : null}
      />
    );
  }

  if (films.length === 0) {
    return (
      <main className={styles.empty}>
        <p className={styles.emptyText}>Aucun film ou série disponible pour l&apos;instant. Reviens bientôt !</p>
      </main>
    );
  }

  const [favoriteIds, entries, dates, artists, studios] = await Promise.all([
    getFavoriteFilmIds(user.id),
    getWatchEntries(user.id),
    getFilmAddedDates(),
    getArtists(),
    getStudios(),
  ]);

  const watchedAt = new Map([...entries].map(([id, e]) => [id, e.at]));
  const collapsed = collapseSeries(films);
  const progress = getSeriesProgress(films, watchedAt);
  const watchedIds = watchedSet(collapsed, watchedAt, progress);
  const favoriteIdsArr = [...favoriteIds];

  const recent = sortByAdded(collapsed, films, dates);
  const continueItems = getContinueItems(films, entries, MIN_RESUME_SECONDS);
  const continueBy = new Map(continueItems.map((i) => [i.key, i]));
  // A series is in the list when any of its episodes was added.
  const favoriteSeries = new Set(films.filter((f) => f.seriesTitle && favoriteIds.has(f.id)).map((f) => f.seriesTitle));
  const myList = collapsed.filter((f) => favoriteIds.has(f.id) || (!!f.seriesTitle && favoriteSeries.has(f.seriesTitle)));
  const topRated = topRatedOf(collapsed);
  const categories = [...new Set(collapsed.map((f) => f.category))].sort((a, b) => a.localeCompare(b, "fr"));
  const creators = creatorsOf(collapsed, [...artists, ...studios]);

  const premiereAsHero = hasPremiereHero(allFilms);

  const slides = recent.slice(0, HERO_SLIDES).map((f, i) => heroSlide(f, continueBy, i === 0 ? "Dernier ajout" : "À la une"));

  return (
    <main className={styles.home}>
      <RefreshOnReturn />
      {premiereAsHero ? <PremiereBanner films={allFilms} hero /> : <Hero slides={slides} />}
      <div className={`${styles.shelves} ${premiereAsHero ? styles.shelvesAfterBanner : ""}`}>
        {!premiereAsHero && <PremiereBanner films={allFilms} />}
        {showPatchNote && <PatchNoteBubble title={settings.patchNoteTitle} message={settings.patchNoteMessage!} />}

        {continueItems.length > 0 && (
          <Shelf title="Reprendre" subtitle="Là où tu t'étais arrêté">
            {continueItems.map((item) => (
              <ContinueCard key={item.key} item={item} />
            ))}
          </Shelf>
        )}

        <Row
          title="Ajoutés récemment"
          films={recent.slice(0, ROW_SIZE)}
          favoriteIds={favoriteIdsArr}
          watchedIds={watchedIds}
          href="/nouveautes"
        />

        <Row title="Bientôt sur ZorAnim" films={collapseSeries(comingSoonFilms)} comingSoon href="/nouveautes" />

        <Row title="Ma liste" films={myList} favoriteIds={favoriteIdsArr} watchedIds={watchedIds} href="/ma-liste" />

        <Row
          title="Les mieux notés"
          subtitle="Par la communauté"
          films={topRated}
          favoriteIds={favoriteIdsArr}
          watchedIds={watchedIds}
        />

        {categories.map((cat) => (
          <Row
            key={cat}
            title={cat}
            films={collapsed.filter((f) => f.category === cat)}
            favoriteIds={favoriteIdsArr}
            watchedIds={watchedIds}
            href={`/catalogue?category=${encodeURIComponent(cat)}`}
          />
        ))}

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
      </div>
    </main>
  );
}
