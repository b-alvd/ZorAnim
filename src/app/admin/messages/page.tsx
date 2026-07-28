import { getContactMessages } from "@/db/queries";
import MessageReplyButton from "./MessageReplyButton";
import styles from "../shared.module.css";

export default async function AdminMessagesPage() {
  const messages = await getContactMessages();

  return (
    <main>
      <div className={styles.header}>
        <h1 className={styles.title}>Messages</h1>
      </div>
      {messages.length === 0 ? (
        <p className={styles.confirmText}>Aucun message pour l&apos;instant.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Sujet</th>
              <th>Message</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {messages.map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td>{m.email}</td>
                <td>{m.subject}</td>
                <td>{m.message.length > 60 ? `${m.message.slice(0, 60)}…` : m.message}</td>
                <td>
                  <span className={`${styles.badge} ${m.status === "replied" ? styles.badgeAdmin : ""}`}>
                    {m.status === "replied" ? "Répondu" : "Ouvert"}
                  </span>
                </td>
                <td>
                  <MessageReplyButton message={m} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
