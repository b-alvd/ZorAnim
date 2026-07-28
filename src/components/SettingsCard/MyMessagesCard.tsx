import type { ContactMessage } from "@/db/queries";
import styles from "./MyRequestsCard.module.css";

function formatDate(createdAt: string) {
  return new Date(createdAt.replace(" ", "T") + "Z").toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function MyMessagesCard({ messages }: { messages: ContactMessage[] }) {
  if (messages.length === 0) {
    return <p className={styles.empty}>Tu n&apos;as envoyé aucun message.</p>;
  }

  return (
    <div className={`${styles.list} ${styles.scrollList}`}>
      {messages.map((m) => (
        <div key={m.id} className={styles.item}>
          <div className={styles.itemHeader}>
            <span className={styles.itemTitle}>{m.subject}</span>
            <span className={styles.badge}>{m.status === "replied" ? "Répondu" : "En attente"}</span>
          </div>
          <span className={styles.meta}>Envoyé le {formatDate(m.createdAt)}</span>
          <p className={styles.meta}>{m.message}</p>
          {m.adminReply && (
            <div className={styles.reply}>
              <span className={styles.replyLabel}>Réponse de l&apos;équipe</span>
              <p className={styles.replyText}>{m.adminReply}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
