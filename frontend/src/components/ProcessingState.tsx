import styles from "./ProcessingState.module.css";

export function ProcessingState() {
  return (
    <div role="status" aria-live="polite" className={styles.row}>
      <span className={styles.spinner} />
      <span>Working some magic — removing background &amp; flipping…</span>
    </div>
  );
}
