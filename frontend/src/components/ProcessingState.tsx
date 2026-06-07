import styles from "./ProcessingState.module.css";

export function ProcessingState() {
  return (
    <div role="status" aria-live="polite" className={styles.row}>
      <span className={styles.spinner} />
      <span>Removing background and flipping…</span>
    </div>
  );
}
