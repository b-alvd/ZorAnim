import { getAdminArtists, getAdminStudios, getUsers, getUsersActivity, PROTECTED_EMAIL } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";
import UsersManager, { type AdminUserItem } from "./UsersManager";
import styles from "../shared.module.css";

const EMPTY_ACTIVITY = {
  views: 0,
  ratings: 0,
  comments: 0,
  favorites: 0,
  lastActivityAt: null,
  lastLoginAt: null,
  activeSessions: 0,
  pendingAppeal: false,
};

async function loadUsers(): Promise<{ items: AdminUserItem[]; loadedAt: number }> {
  const [users, me, artists, studios, activity] = await Promise.all([
    getUsers(),
    getCurrentUser(),
    getAdminArtists(),
    getAdminStudios(),
    getUsersActivity(),
  ]);

  const artistByUser = new Map(artists.filter((a) => a.userId).map((a) => [a.userId!, { id: a.id, name: a.name }]));

  const items = users.map((u) => ({
    ...u,
    isSelf: u.id === me?.id,
    isProtected: u.email === PROTECTED_EMAIL,
    artist: artistByUser.get(u.id) ?? null,
    foundedStudios: studios.filter((s) => s.ownerId === u.id).map((s) => ({ id: s.id, name: s.name })),
    memberStudios: studios
      .filter((s) => s.members.some((m) => m.userId === u.id && m.status === "active"))
      .map((s) => ({ id: s.id, name: s.name })),
    activity: activity.get(u.id) ?? EMPTY_ACTIVITY,
  }));
  // Reference time for relative dates, so server and browser render alike.
  return { items, loadedAt: Date.now() };
}

export default async function AdminUsersPage() {
  const { items, loadedAt } = await loadUsers();

  return (
    <main>
      <div className={styles.header}>
        <h1 className={styles.title}>Utilisateurs</h1>
      </div>
      <UsersManager users={items} now={loadedAt} />
    </main>
  );
}
