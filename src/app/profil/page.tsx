import RefreshOnReturn from "@/components/RefreshOnReturn/RefreshOnReturn";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  getActiveStudioMembershipsDetailed,
  getArtistByUserId,
  getContactMessagesByUser,
  getFavoriteFilmIds,
  getInvitableArtists,
  getPendingArtistSubmissionsByUser,
  getPendingFilmSubmissionsByUser,
  getPendingJoinRequests,
  getPendingStudioInvites,
  getSeriesEpisodeCounts,
  getSeriesEpisodeIds,
  getStudioMembers,
  getStudiosOwnedBy,
  getUserProfileStats,
  getWatchHistory,
  getWatchedFilmIds,
} from "@/db/queries";
import { collapseSeries, computeEffectiveWatchedIds } from "@/lib/series";
import Card from "@/components/Card/Card";
import MyRequestsCard from "@/components/SettingsCard/MyRequestsCard";
import MyMessagesCard from "@/components/SettingsCard/MyMessagesCard";
import AvatarUpload from "./AvatarUpload";
import LogoutButton from "./LogoutButton";
import NameForm from "./NameForm";
import EmailForm from "./EmailForm";
import PasswordForm from "./PasswordForm";
import DeleteAccountForm from "./DeleteAccountForm";
import StudiosCard from "./StudiosCard";
import ProfileTabs from "./ProfileTabs";
import styles from "./profil.module.css";

const RECENT_COUNT = 6;

function formatJoinDate(createdAt: string) {
  return new Date(createdAt.replace(" ", "T") + "Z").toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

function formatWatchTime(minutes: number) {
  if (minutes < 60) return { value: String(minutes), unit: "min" };
  const hours = minutes / 60;
  return { value: hours < 10 ? hours.toFixed(1).replace(".", ",") : String(Math.round(hours)), unit: "h" };
}

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function SettingRow({
  title,
  desc,
  danger,
  children,
}: {
  title: string;
  desc: string;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`${styles.row} ${danger ? styles.rowDanger : ""}`}>
      <div className={styles.rowText}>
        <h3 className={styles.rowTitle}>{title}</h3>
        <p className={styles.rowDesc}>{desc}</p>
      </div>
      <div className={styles.rowBody}>{children}</div>
    </div>
  );
}

async function loadRecent(userId: string) {
  const [history, favoriteIds, watchedIds] = await Promise.all([
    getWatchHistory(userId),
    getFavoriteFilmIds(userId),
    getWatchedFilmIds(userId),
  ]);
  const seriesTitles = [...new Set(history.map((f) => f.seriesTitle).filter((t): t is string => !!t))];
  const [trueCounts, episodeIdsMap] = await Promise.all([
    getSeriesEpisodeCounts(seriesTitles),
    getSeriesEpisodeIds(seriesTitles),
  ]);
  const films = collapseSeries(history, trueCounts).slice(0, RECENT_COUNT);
  const effectiveWatched = computeEffectiveWatchedIds(films, watchedIds, episodeIdsMap);
  return { films, favoriteIds, effectiveWatched };
}

export default async function ProfilPage({ searchParams }: { searchParams: Promise<{ onglet?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  const { onglet } = await searchParams;

  const [
    stats,
    recent,
    filmSubmissions,
    artistSubmissions,
    messages,
    personalArtist,
    ownedStudiosRaw,
    memberStudios,
    pendingInvites,
    joinRequests,
    invitableArtists,
  ] = await Promise.all([
    getUserProfileStats(user.id),
    loadRecent(user.id),
    getPendingFilmSubmissionsByUser(user.id),
    getPendingArtistSubmissionsByUser(user.id),
    getContactMessagesByUser(user.id),
    getArtistByUserId(user.id),
    getStudiosOwnedBy(user.id),
    getActiveStudioMembershipsDetailed(user.id),
    getPendingStudioInvites(user.id),
    getPendingJoinRequests(user.id),
    getInvitableArtists(user.id),
  ]);

  const ownedStudios = await Promise.all(
    ownedStudiosRaw.map(async (studio) => ({ ...studio, members: await getStudioMembers(studio.id) })),
  );

  const hasIdentity = !!personalArtist || ownedStudiosRaw.length > 0 || memberStudios.length > 0;
  const studioNames = [...new Set([...ownedStudiosRaw.map((s) => s.name), ...memberStudios.map((m) => m.studio.name)])];
  const creatorBadge = pendingInvites.length + joinRequests.length;
  const openRequests = filmSubmissions.length + artistSubmissions.length;

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const watchTime = formatWatchTime(stats.watchMinutes);
  const statTiles: { value: string; unit?: string; label: string; href?: string }[] = [
    {
      value: String(stats.watchedCount),
      label: stats.watchedCount > 1 ? "Contenus vus" : "Contenu vu",
      href: "/historique",
    },
    { value: watchTime.value, unit: watchTime.unit, label: "De visionnage" },
    { value: String(stats.favoritesCount), label: "Dans ma liste", href: "/ma-liste" },
    { value: String(stats.commentsCount), label: stats.commentsCount > 1 ? "Commentaires" : "Commentaire" },
    {
      value: stats.avgRatingGiven == null ? "—" : stats.avgRatingGiven.toFixed(1).replace(".", ","),
      unit: stats.avgRatingGiven == null ? undefined : "/5",
      label:
        stats.ratingsCount === 0
          ? "Aucune note donnée"
          : `Note moyenne · ${stats.ratingsCount} note${stats.ratingsCount > 1 ? "s" : ""}`,
    },
  ];

  const activity = (
    <div className={styles.stack}>
      <Section
        title="Vus récemment"
        action={
          recent.films.length > 0 && (
            <Link href="/historique" className={styles.seeAll}>
              Tout l&apos;historique
            </Link>
          )
        }
      >
        {recent.films.length > 0 ? (
          <div className={styles.recentGrid}>
            {recent.films.map((f) => (
              <Card
                key={f.id}
                film={f}
                isFavorite={recent.favoriteIds.has(f.id)}
                isWatched={recent.effectiveWatched.has(f.id)}
                episodeCount={f.episodeCount}
              />
            ))}
          </div>
        ) : (
          <div className={styles.emptyBox}>
            <p>Tu n&apos;as encore rien regardé.</p>
            <Link href="/catalogue" className={styles.primaryLink}>
              Parcourir le catalogue
            </Link>
          </div>
        )}
      </Section>

      <div className={styles.pair}>
        <Section title="Mes demandes en cours">
          <div className={styles.box}>
            <MyRequestsCard filmSubmissions={filmSubmissions} artistSubmissions={artistSubmissions} />
          </div>
        </Section>
        <Section
          title="Mes messages"
          action={
            <Link href="/contact" className={styles.seeAll}>
              Nous écrire
            </Link>
          }
        >
          <div className={styles.box}>
            <MyMessagesCard messages={messages} />
          </div>
        </Section>
      </div>
    </div>
  );

  const account = (
    <div className={styles.rows}>
      <SettingRow title="Pseudo" desc="Visible sur ton profil et par les autres membres. Modifiable tous les 3 jours.">
        <NameForm initialName={user.name} nameChangedAt={user.nameChangedAt} />
      </SettingRow>
      <SettingRow
        title="Adresse email"
        desc="Sert à te connecter. Ton mot de passe actuel est demandé pour la changer."
      >
        <EmailForm initialEmail={user.email} />
      </SettingRow>
      <SettingRow
        title="Mot de passe"
        desc="Choisis un mot de passe d'au moins 8 caractères que tu n'utilises nulle part ailleurs."
      >
        <PasswordForm />
      </SettingRow>
      <SettingRow
        title="Supprimer le compte"
        desc="Action définitive : ton compte, ta liste, ton historique et tes avis seront effacés."
        danger
      >
        <DeleteAccountForm />
      </SettingRow>
    </div>
  );

  const creator = (
    <div className={styles.stack}>
      {hasIdentity && (
        <Link href="/mon-espace" className={styles.creatorBanner}>
          <span>
            <strong>Espace créateur</strong>
            <span className={styles.creatorBannerText}>Gère ton profil artiste, tes studios et tes contenus.</span>
          </span>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>
      )}
      {!personalArtist && (
        <div className={styles.emptyBox}>
          <p>
            Tu publies tes propres animations ? Crée ton profil artiste pour proposer tes contenus, rejoindre ou créer
            un studio.
          </p>
          <Link href="/devenir-artiste" className={styles.primaryLink}>
            Devenir artiste
          </Link>
        </div>
      )}
      {personalArtist && (
        <Section
          title="Studios"
          action={
            <Link href="/creer-un-studio" className={styles.seeAll}>
              + Créer un studio
            </Link>
          }
        >
          <StudiosCard
            ownedStudios={ownedStudios}
            memberStudios={memberStudios}
            pendingInvites={pendingInvites}
            joinRequests={joinRequests}
            invitableArtists={invitableArtists}
          />
        </Section>
      )}
    </div>
  );

  return (
    <main className={styles.page}>
      <RefreshOnReturn />
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <AvatarUpload avatarUrl={user.avatarUrl} initials={initials} />
          <div className={styles.identity}>
            <h1 className={styles.name}>{user.name}</h1>
            <p className={styles.email}>{user.email}</p>
            <div className={styles.chips}>
              <span className={styles.chip}>Membre depuis {formatJoinDate(user.createdAt)}</span>
              {personalArtist && (
                <span className={`${styles.chip} ${styles.chipAccent}`}>Artiste · {personalArtist.name}</span>
              )}
              {studioNames.map((n) => (
                <span key={n} className={styles.chip}>
                  Studio · {n}
                </span>
              ))}
            </div>
          </div>
          <LogoutButton />
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.stats}>
          {statTiles.map((s) => {
            const body = (
              <>
                <span className={styles.statValue}>
                  {s.value}
                  {s.unit && <span className={styles.statUnit}>{s.unit}</span>}
                </span>
                <span className={styles.statLabel}>{s.label}</span>
              </>
            );
            return s.href ? (
              <Link key={s.label} href={s.href} className={`${styles.stat} ${styles.statLink}`}>
                {body}
              </Link>
            ) : (
              <div key={s.label} className={styles.stat}>
                {body}
              </div>
            );
          })}
        </div>

        <ProfileTabs
          initial={onglet ?? "activite"}
          tabs={[
            { id: "activite", label: "Activité", badge: openRequests || undefined, content: activity },
            { id: "compte", label: "Compte", content: account },
            { id: "createur", label: "Créateur", badge: creatorBadge || undefined, content: creator },
          ]}
        />
      </div>
    </main>
  );
}
