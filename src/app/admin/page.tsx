import Image from "next/image";
import {
  getDashboardStats,
  type DashboardStats,
  type RankedContent,
  type RankedEpisode,
  type Trend,
} from "@/db/queries";
import PagedList from "./PagedList";
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

function formatFullDate(iso: string) {
  return parseDate(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function parseDate(iso: string) {
  return new Date(iso.includes("T") ? iso : `${iso.replace(" ", "T")}Z`);
}

function formatRelative(iso: string) {
  const date = parseDate(iso);
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 7) return days === 1 ? "hier" : `il y a ${days} jours`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function StatCard({
  icon,
  value,
  label,
  sub,
  highlight,
  tone,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: React.ReactNode;
  sub?: React.ReactNode;
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
        {sub && <span className={styles.sub}>{sub}</span>}
      </div>
    </div>
  );
}

type RankRow = {
  id: string;
  name: React.ReactNode;
  detail?: React.ReactNode;
  value: React.ReactNode;
  valueDetail?: React.ReactNode;
};

function RankCard({
  icon,
  title,
  emptyLabel,
  rows,
  wide,
}: {
  icon: React.ReactNode;
  title: string;
  emptyLabel: string;
  rows: RankRow[];
  wide?: boolean;
}) {
  return (
    <div className={`${styles.rankCard} ${wide ? styles.rankCardWide : ""}`}>
      <h3 className={styles.rankTitle}>
        <span className={styles.rankTitleIcon}>{icon}</span>
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className={styles.rankEmpty}>{emptyLabel}</p>
      ) : (
        <PagedList className={styles.rankList} pageSize={5}>
          {rows.map((r, i) => (
            <li key={r.id} className={styles.rankRow}>
              <span className={`${styles.rankBadge} ${i === 0 ? styles.rankBadgeFirst : ""}`}>{i + 1}</span>
              <span className={styles.rankText}>
                <span className={styles.rankName}>{r.name}</span>
                {r.detail && <span className={styles.rankDetail}>{r.detail}</span>}
              </span>
              <span className={styles.rankValues}>
                <span className={styles.rankValueMain}>{r.value}</span>
                {r.valueDetail && <span className={styles.rankDetail}>{r.valueDetail}</span>}
              </span>
            </li>
          ))}
        </PagedList>
      )}
    </div>
  );
}

type RankColumn = { label: string; hint?: string };
type RankTableRow = { id: string; name: React.ReactNode; meta?: React.ReactNode; cells: React.ReactNode[] };

function RankTable({
  icon,
  title,
  emptyLabel,
  nameLabel,
  columns,
  rows,
}: {
  icon: React.ReactNode;
  title: string;
  emptyLabel: string;
  nameLabel: string;
  columns: RankColumn[];
  rows: RankTableRow[];
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
        <table className={styles.rankTable}>
          <thead>
            <tr>
              <th className={styles.rankTh} colSpan={2}>
                {nameLabel}
              </th>
              {columns.map((c) => (
                <th key={c.label} className={`${styles.rankTh} ${styles.rankThNum}`} title={c.hint}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className={styles.rankTr}>
                <td className={styles.rankTdBadge}>
                  <span className={`${styles.rankBadge} ${i === 0 ? styles.rankBadgeFirst : ""}`}>{i + 1}</span>
                </td>
                <td className={styles.rankTdName}>
                  <span className={styles.rankName}>{r.name}</span>
                  {r.meta && <span className={styles.rankMeta}>{r.meta}</span>}
                </td>
                {r.cells.map((cell, j) => (
                  <td key={j} className={`${styles.rankTdNum} ${j === 0 ? styles.rankTdMain : ""}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function KindTag({ c }: { c: RankedContent }) {
  return (
    <span className={styles.rankTag}>{c.kind === "series" ? `Série · ${c.episodeCount + " ép."}` : "Film"}</span>
  );
}

function contentMeta(c: RankedContent) {
  return (
    <>
      <KindTag c={c} /> {c.creator}
    </>
  );
}

function episodeName(e: RankedEpisode) {
  return (
    <>
      {e.seriesTitle} <span className={styles.rankTag}>{e.episodeTag}</span>
    </>
  );
}

function stars(value: number) {
  return `★ ${value.toFixed(1)}`;
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
  const total = decided + pending;
  const rate = decided > 0 ? Math.round((accepted / decided) * 100) : null;

  // Donut: accepted then refused, as fractions of the decided requests.
  const R = 34;
  const C = 2 * Math.PI * R;
  const acceptedLen = decided > 0 ? (accepted / decided) * C : 0;
  const refusedLen = decided > 0 ? (refused / decided) * C : 0;
  // Leave a small gap between the two arcs when both exist.
  const gap = accepted > 0 && refused > 0 ? 3 : 0;

  return (
    <div className={styles.rankCard}>
      <div className={styles.acceptHeader}>
        <h3 className={styles.rankTitle}>
          <span className={styles.rankTitleIcon}>{icons.check}</span>
          {title}
        </h3>
        <span className={styles.acceptTotal}>{plural(total, "demande")}</span>
      </div>

      <div className={styles.acceptBody}>
        <div className={styles.donut}>
          <svg viewBox="0 0 80 80" width="96" height="96" aria-hidden="true">
            <circle cx="40" cy="40" r={R} className={styles.donutTrack} />
            {acceptedLen > 0 && (
              <circle
                cx="40"
                cy="40"
                r={R}
                className={styles.donutUp}
                strokeDasharray={`${Math.max(acceptedLen - gap, 0)} ${C}`}
              />
            )}
            {refusedLen > 0 && (
              <circle
                cx="40"
                cy="40"
                r={R}
                className={styles.donutDown}
                strokeDasharray={`${Math.max(refusedLen - gap, 0)} ${C}`}
                strokeDashoffset={-acceptedLen}
              />
            )}
          </svg>
          <div className={styles.donutCenter}>
            {rate !== null ? (
              <>
                <span className={styles.donutValue}>{rate}%</span>
                <span className={styles.donutLabel}>acceptées</span>
              </>
            ) : (
              <span className={styles.donutLabel}>Aucune décision</span>
            )}
          </div>
        </div>

        <div className={styles.acceptTiles}>
          <div className={styles.acceptTile}>
            <span className={`${styles.acceptDot} ${styles.acceptDotUp}`} />
            <span className={styles.acceptTileValue}>{accepted}</span>
            <span className={styles.acceptTileLabel}>{accepted > 1 ? "Acceptées" : "Acceptée"}</span>
          </div>
          <div className={styles.acceptTile}>
            <span className={`${styles.acceptDot} ${styles.acceptDotDown}`} />
            <span className={styles.acceptTileValue}>{refused}</span>
            <span className={styles.acceptTileLabel}>{refused > 1 ? "Refusées" : "Refusée"}</span>
          </div>
          <div className={`${styles.acceptTile} ${pending > 0 ? styles.acceptTilePending : ""}`}>
            <span className={`${styles.acceptDot} ${styles.acceptDotPending}`} />
            <span className={styles.acceptTileValue}>{pending}</span>
            <span className={styles.acceptTileLabel}>En attente</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function plural(n: number, word: string) {
  return `${n} ${word}${n > 1 ? "s" : ""}`;
}

function TrendCard({ icon, label, trend }: { icon: React.ReactNode; label: string; trend: Trend }) {
  const { current, previous } = trend;
  const delta = previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;
  const tone = current > previous ? styles.reactionUp : current < previous ? styles.reactionDown : styles.trendFlat;
  const arrow = current > previous ? "▲" : current < previous ? "▼" : "=";

  return (
    <div className={styles.card}>
      <span className={styles.iconBadge}>{icon}</span>
      <div className={styles.cardText}>
        <span className={styles.number}>{current}</span>
        <span className={styles.label}>{label}</span>
        <span className={`${styles.trend} ${tone}`}>
          {arrow} {delta !== null ? `${delta > 0 ? "+" : ""}${delta}%` : previous === 0 && current > 0 ? "nouveau" : "stable"}
          <span className={styles.trendRef}> vs {previous} avant</span>
        </span>
      </div>
    </div>
  );
}

function formatDay(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function DailyChart({
  title,
  unit,
  days,
  pick,
}: {
  title: string;
  unit: string;
  days: DashboardStats["daily"];
  pick: (d: DashboardStats["daily"][number]) => number;
}) {
  const values = days.map(pick);
  const max = Math.max(...values, 1);
  const total = values.reduce((sum, v) => sum + v, 0);

  return (
    <div className={styles.rankCard}>
      <h3 className={styles.chartTitle}>
        {title}
        <span className={styles.chartTotal}>{plural(total, unit)}</span>
      </h3>
      <div className={styles.chart} role="img" aria-label={`${title} : ${plural(total, unit)} sur 30 jours`}>
        <span className={styles.chartMax}>{max}</span>
        <div className={styles.chartBars}>
          {days.map((d, i) => (
            <div key={d.date} className={styles.chartCol}>
              <span className={styles.chartTip}>
                {formatDay(d.date)} · {plural(values[i], unit)}
              </span>
              <span
                className={`${styles.chartBar} ${values[i] === 0 ? styles.chartBarEmpty : ""}`}
                style={{ height: `${(values[i] / max) * 100}%` }}
              />
            </div>
          ))}
        </div>
      </div>
      <div className={styles.chartAxis}>
        <span>{formatDay(days[0].date)}</span>
        <span>Aujourd&apos;hui</span>
      </div>
    </div>
  );
}

function RatingDistributionCard({
  distribution,
  average,
  count,
}: {
  distribution: number[];
  average: number | null;
  count: number;
}) {
  const max = Math.max(...distribution, 1);

  return (
    <div className={styles.rankCard}>
      <h3 className={styles.rankTitle}>
        <span className={styles.rankTitleIcon}>{icons.star}</span>
        Répartition des notes
      </h3>
      <div className={styles.acceptanceRate}>
        {average !== null ? `★ ${average.toFixed(2)}` : "—"}
        <span className={styles.acceptanceRateLabel}>sur {plural(count, "note")}</span>
      </div>
      <ul className={styles.distList}>
        {[5, 4, 3, 2, 1].map((stars) => {
          const n = distribution[stars - 1];
          return (
            <li key={stars} className={styles.distRow}>
              <span className={styles.distLabel}>{stars}★</span>
              <span className={styles.distTrack}>
                <span className={styles.distFill} style={{ width: `${(n / max) * 100}%` }} />
              </span>
              <span className={styles.rankValue}>{n}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  return (
    <main>
      <h1 className={styles.title}>Tableau de bord</h1>

      <h2 className={styles.sectionTitle}>À traiter</h2>
      <div className={styles.grid}>
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

      <h2 className={styles.sectionTitle}>Vue d&apos;ensemble</h2>
      <div className={styles.grid}>
        <StatCard
          icon={icons.film}
          value={stats.filmCount}
          label="Films et séries"
          sub={`dont ${plural(stats.episodeCount, "épisode")}`}
        />
        <StatCard
          icon={icons.users}
          value={stats.userCount}
          label="Utilisateurs"
          sub={`${stats.activeUsers30d} actif${stats.activeUsers30d > 1 ? "s" : ""} sur 30j`}
        />
        <StatCard icon={icons.artist} value={stats.artistCount} label="Artistes" />
        <StatCard icon={icons.studio} value={stats.studioCount} label="Studios" />
      </div>

      <h2 className={styles.sectionTitle}>30 derniers jours</h2>
      <div className={styles.grid}>
        <TrendCard icon={icons.eye} label="Visionnages" trend={stats.trends.views} />
        <TrendCard icon={icons.trending} label="Inscriptions" trend={stats.trends.signups} />
        <TrendCard icon={icons.commentaires} label="Commentaires" trend={stats.trends.comments} />
        <TrendCard icon={icons.star} label="Notes données" trend={stats.trends.ratings} />
        <StatCard
          icon={icons.users}
          value={
            <>
              {stats.activeUsers7d}
              <span className={styles.reactionSep}>/</span>
              {stats.activeUsers30d}
            </>
          }
          label="Membres actifs"
          sub="7 jours / 30 jours"
        />
        <StatCard
          icon={icons.film}
          value={
            <>
              {stats.newFilms7d}
              <span className={styles.reactionSep}>/</span>
              {stats.newFilms30d}
            </>
          }
          label="Nouveaux contenus"
          sub="7 jours / 30 jours"
        />
      </div>

      <div className={`${styles.rankings} ${styles.chartsRow}`}>
        <DailyChart title="Visionnages" unit="visionnage" days={stats.daily} pick={(d) => d.views} />
        <DailyChart
          title="Commentaires et notes"
          unit="interaction"
          days={stats.daily}
          pick={(d) => d.interactions}
        />
        <DailyChart title="Inscriptions" unit="inscription" days={stats.daily} pick={(d) => d.signups} />
      </div>

      <h2 className={styles.sectionTitle}>Engagement (total)</h2>
      <div className={styles.grid}>
        <StatCard
          icon={icons.eye}
          value={stats.totalViews}
          label="Visionnages"
          sub={`${stats.memberViews} membres · ${stats.guestViews} invités`}
        />
        <StatCard icon={icons.heart} value={stats.totalFavorites} label="Ajouts à la liste" />
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
      <div className={`${styles.rankings} ${styles.rankingsWide}`}>
        <RankTable
          icon={icons.eye}
          title="Films et séries les plus vus"
          emptyLabel="Aucun visionnage."
          nameLabel="Contenu"
          columns={[
            { label: "Vues" },
            { label: "Membres", hint: "Vues de membres connectés" },
            { label: "Invités", hint: "Vues sans compte" },
          ]}
          rows={stats.topContents.map((c) => ({
            id: c.id,
            name: c.title,
            meta: contentMeta(c),
            cells: [c.views, c.memberViews, c.guestViews],
          }))}
        />
        <RankTable
          icon={icons.eye}
          title="Épisodes les plus vus"
          emptyLabel="Aucun épisode vu."
          nameLabel="Épisode"
          columns={[{ label: "Vues" }, { label: "Membres" }, { label: "Invités" }]}
          rows={stats.topEpisodes.map((e) => ({
            id: e.id,
            name: episodeName(e),
            meta: e.episodeTitle,
            cells: [e.views, e.memberViews, e.guestViews],
          }))}
        />
        <RankTable
          icon={icons.star}
          title="Films et séries les mieux notés"
          emptyLabel="Aucune note."
          nameLabel="Contenu"
          columns={[{ label: "Note" }, { label: "Votants", hint: "Membres ayant noté (au moins un épisode pour une série)" }]}
          rows={stats.topRatedContents.map((c) => ({
            id: c.id,
            name: c.title,
            meta: contentMeta(c),
            cells: [stars(c.average), c.voters],
          }))}
        />
        <RankTable
          icon={icons.star}
          title="Épisodes les mieux notés"
          emptyLabel="Aucun épisode noté."
          nameLabel="Épisode"
          columns={[{ label: "Note" }, { label: "Votants" }]}
          rows={stats.topRatedEpisodes.map((e) => ({
            id: e.id,
            name: episodeName(e),
            meta: e.episodeTitle,
            cells: [stars(e.average), e.count],
          }))}
        />
        <RankTable
          icon={icons.commentaires}
          title="Films et séries les plus commentés"
          emptyLabel="Aucun commentaire."
          nameLabel="Contenu"
          columns={[
            { label: "Total" },
            { label: "Réponses", hint: "Réponses à un autre commentaire" },
            { label: "Auteurs", hint: "Membres différents" },
          ]}
          rows={stats.topCommentedContents.map((c) => ({
            id: c.id,
            name: c.title,
            meta: c.topEpisode ? (
              <>
                <KindTag c={c} /> surtout {c.topEpisode.episodeTag} ({c.topEpisode.count})
              </>
            ) : (
              contentMeta(c)
            ),
            cells: [c.count, c.replies, c.commenters],
          }))}
        />
        <RankTable
          icon={icons.users}
          title="Membres les plus actifs"
          emptyLabel="Aucune activité."
          nameLabel="Membre"
          columns={[
            { label: "Comm." , hint: "Commentaires et réponses" },
            { label: "Notes" },
            { label: "Moy.", hint: "Note moyenne donnée" },
            { label: "Vus", hint: "Contenus regardés" },
          ]}
          rows={stats.topMembers.map((m) => ({
            id: m.id,
            name: m.name,
            meta: m.joinedAt ? `Membre depuis le ${formatFullDate(m.joinedAt)}` : undefined,
            cells: [m.comments, m.ratings, m.averageGiven !== null ? m.averageGiven.toFixed(1) : "—", m.views],
          }))}
        />
        <RankTable
          icon={icons.artist}
          title="Artistes les plus prolifiques (perso + studios)"
          emptyLabel="Aucun artiste."
          nameLabel="Artiste"
          columns={[
            { label: "Films" },
            { label: "Séries" },
            { label: "Épisodes" },
          ]}
          rows={stats.topArtists.map((a) => ({
            id: a.id,
            name: a.name,
            cells: [a.films, a.series, a.episodes],
          }))}
        />
      </div>

      <h2 className={styles.sectionTitle}>Notes et catalogue</h2>
      <div className={styles.rankings}>
        <RatingDistributionCard
          distribution={stats.ratingDistribution}
          average={stats.averageRating}
          count={stats.ratingCount}
        />
        <RankCard
          icon={icons.tag}
          title="Répartition par catégorie"
          emptyLabel="Aucun film ou série."
          rows={stats.categoryBreakdown.map((c) => ({
            id: c.category,
            name: c.category,
            value: plural(c.count, "contenu"),
          }))}
        />
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
            <PagedList className={styles.feed}>
              {stats.recentFilms.map((f) => (
                <li key={f.id} className={styles.feedItem}>
                  <span className={styles.feedPoster}>
                    <Image src={f.poster} alt="" fill sizes="64px" unoptimized />
                  </span>
                  <div className={styles.feedBody}>
                    <div className={styles.feedTop}>
                      <span className={styles.feedTitle}>{f.title}</span>
                      <time className={styles.feedDate} title={formatFullDate(f.createdAt)}>
                        {formatRelative(f.createdAt)}
                      </time>
                    </div>
                    <div className={styles.feedMeta}>
                      <span className={styles.rankTag}>
                        {f.announced
                          ? f.kind === "series"
                            ? "Série · annonce"
                            : "Film · annonce"
                          : f.kind === "series"
                            ? `Série · ${f.episodeCount} ép.`
                            : "Film"}
                      </span>
                      {f.artistName}
                    </div>
                    {f.latestEpisode && (
                      <div className={styles.feedNote}>
                        Dernier ajout : <span className={styles.rankTag}>{f.latestEpisode.episodeTag}</span>{" "}
                        {f.latestEpisode.episodeTitle}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </PagedList>
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
            <PagedList className={styles.feed} pageSize={3}>
              {stats.recentComments.map((c) => (
                <li key={c.id} className={styles.feedItem}>
                  <span className={styles.feedAvatar}>
                    {c.userAvatarUrl ? (
                      <Image src={c.userAvatarUrl} alt="" fill sizes="36px" unoptimized />
                    ) : (
                      c.userName.charAt(0).toUpperCase()
                    )}
                  </span>
                  <div className={styles.feedBody}>
                    <div className={styles.feedTop}>
                      <span className={styles.feedTitle}>
                        {c.userName}{" "}
                        <span className={styles.feedAction}>{c.isReply ? "a répondu sur" : "a commenté"}</span>
                      </span>
                      <time className={styles.feedDate} title={formatFullDate(c.createdAt)}>
                        {formatRelative(c.createdAt)}
                      </time>
                    </div>
                    <div className={styles.feedMeta}>
                      {c.contentTitle}
                      {c.episode && <span className={styles.rankTag}>{c.episode.episodeTag}</span>}
                    </div>
                    <p className={styles.feedQuote}>{c.body}</p>
                  </div>
                </li>
              ))}
            </PagedList>
          )}
        </div>
      </div>
    </main>
  );
}
