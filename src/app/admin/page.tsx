import { getDashboardStats } from "@/db/queries";
import styles from "./dashboard.module.css";

const icons = {
  film: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M7 4v16M17 4v16M2 9h5M2 15h5M17 9h5M17 15h5" />
    </svg>
  ),
  artist: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  ),
  studio: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="7" width="18" height="14" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  demandes: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16v12H8l-4 4z" />
    </svg>
  ),
  messages: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  invite: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6M22 11h-6" />
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" stroke="none">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
    </svg>
  ),
  commentaires: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 12h.01M12 12h.01M16 12h.01" />
      <path d="M21 12c0 4.42-4.03 8-9 8-1.18 0-2.31-.2-3.34-.56L3 21l1.67-4.17C3.62 15.61 3 13.87 3 12c0-4.42 4.03-8 9-8s9 3.58 9 8z" />
    </svg>
  ),
  thumbs: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" stroke="none">
      <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
    </svg>
  ),
  trending: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 6l-9.5 9.5-5-5L1 18" />
      <path d="M17 6h6v6" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  tag: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.59 13.41L11 3.83V3H3v8l.83.83 9.58 9.58a2 2 0 0 0 2.83 0l4.35-4.35a2 2 0 0 0 0-2.83z" />
      <circle cx="6.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function StatCard({
  icon,
  value,
  label,
  highlight,
  tone,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: React.ReactNode;
  highlight?: boolean;
  tone?: "up" | "down";
}) {
  return (
    <div className={`${styles.card} ${highlight ? styles.cardHighlight : ""}`}>
      <span className={`${styles.iconBadge} ${highlight ? styles.iconBadgeAccent : ""}`}>{icon}</span>
      <div className={styles.cardText}>
        <span className={`${styles.number} ${tone === "up" ? styles.reactionUp : tone === "down" ? styles.reactionDown : ""}`}>
          {value}
        </span>
        <span className={styles.label}>{label}</span>
      </div>
    </div>
  );
}

function RankCard({
  icon,
  title,
  emptyLabel,
  rows,
}: {
  icon: React.ReactNode;
  title: string;
  emptyLabel: string;
  rows: { id: string; name: string; value: string }[];
}) {
  return (
    <div className={styles.rankCard}>
      <h3 className={styles.rankTitle}>
        <span className={styles.rankTitleIcon}>{icon}</span>
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className={styles.rankEmpty}>{emptyLabel}</p>
      ) : (
        <ol className={styles.rankList}>
          {rows.map((r, i) => (
            <li key={r.id} className={styles.rankRow}>
              <span className={`${styles.rankBadge} ${i === 0 ? styles.rankBadgeFirst : ""}`}>{i + 1}</span>
              <span className={styles.rankName}>{r.name}</span>
              <span className={styles.rankValue}>{r.value}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function AcceptanceCard({
  title,
  accepted,
  refused,
  pending,
}: {
  title: string;
  accepted: number;
  refused: number;
  pending: number;
}) {
  const decided = accepted + refused;
  const rate = decided > 0 ? Math.round((accepted / decided) * 100) : null;

  return (
    <div className={styles.rankCard}>
      <h3 className={styles.rankTitle}>
        <span className={styles.rankTitleIcon}>{icons.check}</span>
        {title}
      </h3>
      <div className={styles.acceptanceRate}>
        {rate !== null ? `${rate}%` : "—"}
        <span className={styles.acceptanceRateLabel}>acceptées</span>
      </div>
      <div className={styles.acceptanceBar}>
        {decided > 0 && (
          <>
            <span className={styles.acceptanceBarUp} style={{ width: `${(accepted / decided) * 100}%` }} />
            <span className={styles.acceptanceBarDown} style={{ width: `${(refused / decided) * 100}%` }} />
          </>
        )}
      </div>
      <div className={styles.acceptanceStats}>
        <span className={styles.reactionUp}>{accepted} acceptées</span>
        <span className={styles.reactionDown}>{refused} refusées</span>
        <span className={styles.label}>{pending} en attente</span>
      </div>
    </div>
  );
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  return (
    <main>
      <h1 className={styles.title}>Tableau de bord</h1>

      <div className={styles.grid}>
        <StatCard icon={icons.film} value={stats.filmCount} label="Films" />
        <StatCard icon={icons.artist} value={stats.artistCount} label="Artistes" />
        <StatCard icon={icons.studio} value={stats.studioCount} label="Studios" />
        <StatCard icon={icons.users} value={stats.userCount} label="Utilisateurs" />
        <StatCard
          icon={icons.demandes}
          value={stats.pendingCount}
          label="Demandes en attente"
          highlight={stats.pendingCount > 0}
        />
        <StatCard
          icon={icons.messages}
          value={stats.openMessageCount}
          label="Messages ouverts"
          highlight={stats.openMessageCount > 0}
        />
        <StatCard
          icon={icons.invite}
          value={stats.pendingInviteCount}
          label="Invitations en attente"
          highlight={stats.pendingInviteCount > 0}
        />
      </div>

      <h2 className={styles.sectionTitle}>Engagement</h2>
      <div className={styles.grid}>
        <StatCard icon={icons.eye} value={stats.totalViews} label="Visionnages" />
        <StatCard icon={icons.heart} value={stats.totalFavorites} label="Ajouts à la liste" />
        <StatCard
          icon={icons.star}
          value={stats.averageRating !== null ? stats.averageRating.toFixed(1) : "—"}
          label={`Note moyenne (${stats.ratingCount} note${stats.ratingCount > 1 ? "s" : ""})`}
        />
        <StatCard icon={icons.commentaires} value={stats.commentCount} label="Commentaires" />
        <StatCard
          icon={icons.thumbs}
          value={
            <>
              <span className={styles.reactionUp}>{stats.reactionUpCount}</span>
              <span className={styles.reactionSep}>/</span>
              <span className={styles.reactionDown}>{stats.reactionDownCount}</span>
            </>
          }
          label="Réactions positives / négatives"
        />
      </div>

      <h2 className={styles.sectionTitle}>Classements</h2>
      <div className={styles.rankings}>
        <RankCard
          icon={icons.eye}
          title="Films les plus vus"
          emptyLabel="Aucun visionnage."
          rows={stats.topViewedFilms.map((f) => ({
            id: f.id,
            name: f.title,
            value: `${f.views} vue${f.views > 1 ? "s" : ""}`,
          }))}
        />
        <RankCard
          icon={icons.star}
          title="Films les mieux notés"
          emptyLabel="Aucune note."
          rows={stats.topRatedFilms.map((f) => ({
            id: f.id,
            name: f.title,
            value: `★ ${f.average.toFixed(1)} (${f.count})`,
          }))}
        />
        <RankCard
          icon={icons.artist}
          title="Artistes les plus prolifiques"
          emptyLabel="Aucun artiste."
          rows={stats.topArtists.map((a) => ({
            id: a.id,
            name: a.name,
            value: `${a.filmCount} film${a.filmCount > 1 ? "s" : ""}`,
          }))}
        />
      </div>

      <h2 className={styles.sectionTitle}>Croissance</h2>
      <div className={styles.grid}>
        <StatCard icon={icons.trending} value={stats.newUsers7d} label="Nouveaux utilisateurs (7j)" />
        <StatCard icon={icons.trending} value={stats.newUsers30d} label="Nouveaux utilisateurs (30j)" />
        <StatCard icon={icons.film} value={stats.newFilms7d} label="Nouveaux films (7j)" />
        <StatCard icon={icons.film} value={stats.newFilms30d} label="Nouveaux films (30j)" />
      </div>

      <h2 className={styles.sectionTitle}>Taux d&apos;acceptation</h2>
      <div className={styles.rankings}>
        <AcceptanceCard
          title="Films soumis"
          accepted={stats.filmSubmissionsAccepted}
          refused={stats.filmSubmissionsRefused}
          pending={stats.filmSubmissionsPending}
        />
        <AcceptanceCard
          title="Demandes d'artiste"
          accepted={stats.artistSubmissionsAccepted}
          refused={stats.artistSubmissionsRefused}
          pending={stats.artistSubmissionsPending}
        />
        <RankCard
          icon={icons.tag}
          title="Répartition par catégorie"
          emptyLabel="Aucun film ou série."
          rows={stats.categoryBreakdown.map((c) => ({
            id: c.category,
            name: c.category,
            value: `${c.count} film${c.count > 1 ? "s" : ""}`,
          }))}
        />
      </div>

      <h2 className={styles.sectionTitle}>Activité récente</h2>
      <div className={styles.rankings}>
        <div className={styles.rankCard}>
          <h3 className={styles.rankTitle}>
            <span className={styles.rankTitleIcon}>{icons.clock}</span>
            Derniers films et séries ajoutés
          </h3>
          {stats.recentFilms.length === 0 ? (
            <p className={styles.rankEmpty}>Aucun film ou série.</p>
          ) : (
            <ul className={styles.activityList}>
              {stats.recentFilms.map((f) => (
                <li key={f.id} className={styles.activityRow}>
                  <div className={styles.activityText}>
                    <span className={styles.activityTitle}>{f.title}</span>
                    <span className={styles.activityMeta}>{f.artistName}</span>
                  </div>
                  <span className={styles.activityDate}>{formatDate(f.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.rankCard}>
          <h3 className={styles.rankTitle}>
            <span className={styles.rankTitleIcon}>{icons.commentaires}</span>
            Derniers commentaires
          </h3>
          {stats.recentComments.length === 0 ? (
            <p className={styles.rankEmpty}>Aucun commentaire.</p>
          ) : (
            <ul className={styles.activityList}>
              {stats.recentComments.map((c) => (
                <li key={c.id} className={styles.activityRow}>
                  <div className={styles.activityText}>
                    <span className={styles.activityTitle}>{c.userName}</span>
                    <span className={styles.activityMeta}>
                      sur {c.filmTitle} - Message : {c.body.length > 60 ? `${c.body.slice(0, 60)}…` : c.body}
                    </span>
                  </div>
                  <span className={styles.activityDate}>{formatDate(c.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
