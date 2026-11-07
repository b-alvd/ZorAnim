import Link from "next/link";
import HelpCenter from "@/components/HelpCenter/HelpCenter";
import { getCurrentUser } from "@/lib/auth/current-user";
import ContactForm from "./ContactForm";
import styles from "./contact.module.css";

export const metadata = {
  title: "Contact | ZorAnim",
};

const infos = [
  {
    title: "Réponse sous 2 à 3 jours ouvrés",
    text: "La réponse arrive dans ton profil, avec une notification.",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
    ),
  },
  {
    title: "Consulter l'aide",
    text: "La réponse à ta question y est peut-être déjà.",
    href: "/aide",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6" />
        <circle cx="12" cy="17" r="0.6" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Publier tes animations",
    text: "Pas besoin de nous écrire : tout passe par ton Espace créateur.",
    href: "/soumettre-un-film",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M10 9.5v5l4-2.5z" fill="currentColor" />
      </svg>
    ),
  },
];

export default async function ContactPage() {
  const user = await getCurrentUser();

  return (
    <HelpCenter
      active="contact"
      title="Écrire à l'équipe"
      subtitle="Une question, un bug, une suggestion ? On lit tous les messages et on te répond directement."
    >
      <div className={styles.layout}>
        <div className={styles.panel}>
          {user ? (
            <ContactForm name={user.name} email={user.email} />
          ) : (
            <div className={styles.sent}>
              <span className={styles.lockIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="5" y="11" width="14" height="9" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
              </span>
              <h2>Connecte-toi pour nous écrire</h2>
              <p>Ton message et notre réponse restent ainsi au même endroit, dans ton profil.</p>
              <div className={styles.sentActions}>
                <Link href="/connexion" className={styles.primaryBtn}>
                  Se connecter
                </Link>
                <Link href="/inscription" className={styles.ghostBtn}>
                  Créer un compte
                </Link>
              </div>
            </div>
          )}
        </div>

        <aside className={styles.side}>
          {infos.map((info) => {
            const body = (
              <>
                <span className={styles.infoIcon}>{info.icon}</span>
                <div className={styles.infoText}>
                  <strong>{info.title}</strong>
                  <p>{info.text}</p>
                </div>
              </>
            );
            return info.href ? (
              <Link key={info.title} href={info.href} className={`${styles.info} ${styles.infoClickable}`}>
                {body}
                <svg
                  className={styles.infoChevron}
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </Link>
            ) : (
              <div key={info.title} className={styles.info}>
                {body}
              </div>
            );
          })}
        </aside>
      </div>
    </HelpCenter>
  );
}
