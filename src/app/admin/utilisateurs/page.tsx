import { getUsers, PROTECTED_EMAIL } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";
import Pagination from "@/components/Pagination/Pagination";
import { banUserAction, deleteUserAction, toggleRoleAction, unbanUserAction } from "./actions";
import ConfirmDeleteButton from "../ConfirmDeleteButton";
import BanUserButton from "./BanUserButton";
import styles from "../shared.module.css";

const PAGE_SIZE = 20;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const [allUsers, me] = await Promise.all([getUsers(), getCurrentUser()]);

  const { page: pageParam } = await searchParams;
  const totalPages = Math.max(1, Math.ceil(allUsers.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(pageParam) || 1), totalPages);
  const users = allUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <main>
      <div className={styles.header}>
        <h1 className={styles.title}>Utilisateurs</h1>
      </div>
      <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Email</th>
            <th>Rôle</th>
            <th>Inscrit le</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const isSelf = u.id === me?.id;
            const isProtected = u.email === PROTECTED_EMAIL;
            return (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`${styles.badge} ${u.role === "admin" ? styles.badgeAdmin : ""}`}>
                    {u.role === "admin" ? "Admin" : "Utilisateur"}
                  </span>
                  {u.banned && (
                    <span className={styles.badge} title={u.banReason ?? undefined} style={{ marginLeft: 6 }}>
                      Banni
                    </span>
                  )}
                </td>
                <td>{new Date(u.createdAt).toLocaleDateString("fr-FR")}</td>
                <td>
                  {!isSelf && !isProtected && (
                    <div className={styles.rowActions}>
                      <form action={toggleRoleAction.bind(null, u.id, u.role)}>
                        <button type="submit" className={styles.linkBtn}>
                          {u.role === "admin" ? "Retirer admin" : "Passer admin"}
                        </button>
                      </form>
                      {u.banned ? (
                        <form action={unbanUserAction.bind(null, u.id)}>
                          <button type="submit" className={styles.linkBtn}>
                            Débannir
                          </button>
                        </form>
                      ) : (
                        <BanUserButton userId={u.id} userName={u.name} banAction={banUserAction} />
                      )}
                      <ConfirmDeleteButton action={deleteUserAction.bind(null, u.id)} itemName={u.name} />
                    </div>
                  )}
                  {isSelf && <span className={styles.badge}>Toi</span>}
                  {!isSelf && isProtected && <span className={styles.badge}>Protégé</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
      <Pagination page={page} totalPages={totalPages} basePath="/admin/utilisateurs" />
    </main>
  );
}
