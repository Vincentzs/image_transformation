import type { ProcessedImage } from "../types.js";
import { CopyUrlButton } from "./CopyUrlButton.js";
import styles from "./Gallery.module.css";

interface Props {
  images: ProcessedImage[];
  onDelete: (id: string) => void;
  deletingId: string | null;
}

export function Gallery({ images, onDelete, deletingId }: Props) {
  if (images.length === 0) {
    return <p className={styles.empty}>No images yet. Upload one to get started.</p>;
  }

  return (
    <div className={styles.grid}>
      {images.map((img) => (
        <div key={img.id} className={styles.card}>
          <img src={img.url} alt="Hosted result" className={styles.image} />
          <CopyUrlButton url={img.url} className={styles.copyButton} />
          <button
            onClick={() => onDelete(img.id)}
            disabled={deletingId === img.id}
            className={styles.deleteButton}
          >
            {deletingId === img.id ? "Deleting…" : "Delete"}
          </button>
        </div>
      ))}
    </div>
  );
}
