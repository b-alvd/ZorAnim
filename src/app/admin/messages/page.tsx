import { getContactMessages } from "@/db/queries";
import MessagesManager from "./MessagesManager";
import styles from "../shared.module.css";

async function loadMessages() {
  const messages = await getContactMessages();
  // Reference time for relative dates, so server and browser render alike.
  return { messages, loadedAt: Date.now() };
}

export default async function AdminMessagesPage() {
  const { messages, loadedAt } = await loadMessages();

  return (
    <main>
      <div className={styles.header}>
        <h1 className={styles.title}>Messages</h1>
      </div>
      <MessagesManager messages={messages} now={loadedAt} />
    </main>
  );
}
