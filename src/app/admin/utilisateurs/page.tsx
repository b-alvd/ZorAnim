import { getUsers } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";
import { deleteUserAction, toggleRoleAction } from "./actions";
import ConfirmDeleteButton from "../ConfirmDeleteButton";
import styles from "../shared.module.css";

export default async function AdminUsersPage() {
  const [users, me] = await Promise.all([getUsers(), getCurrentUser()]);

  return (
    <main>
      <div className={styles.header}>
        <h1 className={styles.title}>Utilisateurs</h1>
      </div>
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
            return (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`${styles.badge} ${u.role === "admin" ? styles.badgeAdmin : ""}`}>
                    {u.role === "admin" ? "Admin" : "Utilisateur"}
                  </span>
                </td>
                <td>{new Date(u.createdAt).toLocaleDateString("fr-FR")}</td>
                <td>
                  {!isSelf && (
                    <div className={styles.rowActions}>
                      <form action={toggleRoleAction.bind(null, u.id, u.role)}>
                        <button type="submit" className={styles.linkBtn}>
                          {u.role === "admin" ? "Retirer admin" : "Passer admin"}
                        </button>
                      </form>
                      <ConfirmDeleteButton action={deleteUserAction.bind(null, u.id)} itemName={u.name} />
                    </div>
                  )}
                  {isSelf && <span className={styles.badge}>Toi</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}
