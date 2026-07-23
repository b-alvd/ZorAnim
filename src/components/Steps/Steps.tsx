import styles from "./Steps.module.css";

export type Step = { title: string; description: string };

export default function Steps({ steps }: { steps: Step[] }) {
  return (
    <ol className={styles.steps}>
      {steps.map((step, i) => (
        <li key={step.title} className={styles.step}>
          <span className={styles.number}>{i + 1}</span>
          <div>
            <p className={styles.title}>{step.title}</p>
            <p className={styles.description}>{step.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
