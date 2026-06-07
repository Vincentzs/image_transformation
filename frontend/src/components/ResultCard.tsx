import type { ProcessedImage } from "../types.js";
import { CopyUrlButton } from "./CopyUrlButton.js";
import styles from "./ResultCard.module.css";

interface Props {
  image: ProcessedImage;
}

export function ResultCard({ image }: Props) {
  return (
    <div className={styles.card}>
      <h2 className={styles.heading}>✨ Ta-da!</h2>
      <img src={image.url} alt="Processed result" className={styles.image} />
      <div className={styles.row}>
        <input readOnly value={image.url} aria-label="Image URL" className={styles.url} />
        <CopyUrlButton url={image.url} />
      </div>
    </div>
  );
}
