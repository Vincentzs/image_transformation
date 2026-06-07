import { ACHIEVEMENTS, isUnlocked } from "../lib/gamification.js";
import styles from "./Achievements.module.css";

interface Props {
  count: number;
}

/** Trophy case: badges light up as milestones are reached. */
export function Achievements({ count }: Props) {
  return (
    <div className={styles.row}>
      {ACHIEVEMENTS.map((a) => {
        const unlocked = isUnlocked(a, count);
        return (
          <div
            key={a.id}
            className={`${styles.badge} ${unlocked ? styles.unlocked : styles.locked}`}
            title={unlocked ? a.label : `${a.label} — unlock at ${a.threshold}`}
          >
            <span className={styles.icon}>{unlocked ? a.icon : "🔒"}</span>
            <span className={styles.label}>{a.label}</span>
          </div>
        );
      })}
    </div>
  );
}
