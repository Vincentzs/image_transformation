import styles from "./LevelUpBanner.module.css";

interface Props {
  level: number;
}

/** Center-screen celebration shown when the player levels up. */
export function LevelUpBanner({ level }: Props) {
  return (
    <div className={styles.overlay} aria-hidden="true">
      <div className={styles.card}>
        <span className={styles.spark}>✨</span>
        <span className={styles.title}>LEVEL UP!</span>
        <span className={styles.level}>Level {level}</span>
      </div>
    </div>
  );
}
