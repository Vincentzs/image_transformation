import { useEffect, useState } from "react";
import styles from "./Confetti.module.css";

const COLORS = ["#7c3aed", "#ec4899", "#f59e0b", "#06b6d4", "#22c55e"];
const PIECES = 90;

interface Piece {
  id: number;
  left: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
}

interface Props {
  /** Increment to fire a burst. 0 = idle (no burst). */
  fireKey: number;
}

/** Dependency-free confetti rain, triggered whenever `fireKey` changes. */
export function Confetti({ fireKey }: Props) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (fireKey === 0) return;
    const burst = Array.from({ length: PIECES }, (_, i) => ({
      id: fireKey * 1000 + i,
      left: Math.random() * 100,
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 0.25,
      duration: 1.4 + Math.random() * 1.1,
      size: 7 + Math.random() * 7,
    }));
    setPieces(burst);
    const timer = setTimeout(() => setPieces([]), 2800);
    return () => clearTimeout(timer);
  }, [fireKey]);

  if (pieces.length === 0) return null;

  return (
    <div className={styles.layer} aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className={styles.piece}
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size * 1.4}px`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
