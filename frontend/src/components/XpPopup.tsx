import styles from "./XpPopup.module.css";

interface Props {
  amount: number;
}

/** Floating "+N XP" reward that rises and fades. Remount (via key) to replay. */
export function XpPopup({ amount }: Props) {
  return (
    <div className={styles.popup} aria-hidden="true">
      +{amount} XP
    </div>
  );
}
