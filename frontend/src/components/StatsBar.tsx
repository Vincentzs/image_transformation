import { levelFor, levelProgress, PER_LEVEL, xpFor } from "../lib/gamification.js";
import styles from "./StatsBar.module.css";

interface Props {
  count: number;
}

/** Game HUD: level badge, XP, and a progress bar toward the next level. */
export function StatsBar({ count }: Props) {
  const level = levelFor(count);
  const xp = xpFor(count);
  const progress = levelProgress(count);
  const pct = Math.round((progress / PER_LEVEL) * 100);
  const remaining = PER_LEVEL - progress;

  return (
    <div className={styles.bar}>
      <div className={styles.badge}>
        <span className={styles.level}>{level}</span>
        <span className={styles.lvl}>LVL</span>
      </div>
      <div className={styles.progress}>
        <div className={styles.meta}>
          <span className={styles.xp}>{xp} XP</span>
          <span className={styles.next}>
            {remaining} more to Level {level + 1}
          </span>
        </div>
        <div className={styles.track}>
          <div className={styles.fill} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
