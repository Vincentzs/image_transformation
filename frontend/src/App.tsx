import { useImages } from "./hooks/useImages.js";
import { ErrorBoundary } from "./components/ErrorBoundary.js";
import { UploadDropzone } from "./components/UploadDropzone.js";
import { ProcessingState } from "./components/ProcessingState.js";
import { ResultCard } from "./components/ResultCard.js";
import { Gallery } from "./components/Gallery.js";
import styles from "./App.module.css";

export default function App() {
  const { images, latest, processing, deletingId, error, upload, remove } = useImages();

  return (
    <ErrorBoundary>
      <main className={styles.main}>
        <h1 className={styles.title}>Image Transformer</h1>
        <p className={styles.subtitle}>
          Upload an image — we remove the background and flip it horizontally.
        </p>

        <UploadDropzone onFileSelected={upload} disabled={processing} />

        {processing && <ProcessingState />}

        {error && (
          <div role="alert" className={styles.error}>
            {error}
          </div>
        )}

        {latest && <ResultCard image={latest} />}

        <h2 className={styles.sectionTitle}>Your images</h2>
        <Gallery images={images} onDelete={remove} deletingId={deletingId} />
      </main>
    </ErrorBoundary>
  );
}
