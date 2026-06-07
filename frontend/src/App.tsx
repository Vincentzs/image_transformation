import { useImages } from "./hooks/useImages.js";
import { ErrorBoundary } from "./components/ErrorBoundary.js";
import { StatsBar } from "./components/StatsBar.js";
import { Achievements } from "./components/Achievements.js";
import { Confetti } from "./components/Confetti.js";
import { UploadDropzone } from "./components/UploadDropzone.js";
import { ProcessingState } from "./components/ProcessingState.js";
import { ResultCard } from "./components/ResultCard.js";
import { Gallery } from "./components/Gallery.js";
import styles from "./App.module.css";

export default function App() {
  const { images, latest, processing, deletingId, error, successCount, upload, remove } =
    useImages();

  return (
    <ErrorBoundary>
      <Confetti fireKey={successCount} />
      <main className={styles.main}>
        <header className={styles.hero}>
          <h1 className={styles.title}>Image Transformer</h1>
          <p className={styles.subtitle}>
            Drop an image and watch the background vanish — then it flips, like magic. ✨
          </p>
        </header>

        <StatsBar count={images.length} />

        <UploadDropzone onFileSelected={upload} disabled={processing} />

        {processing && <ProcessingState />}

        {error && (
          <div role="alert" className={styles.error}>
            {error}
          </div>
        )}

        {latest && <ResultCard image={latest} />}

        <h2 className={styles.sectionTitle}>🏆 Achievements</h2>
        <Achievements count={images.length} />

        <h2 className={styles.sectionTitle}>Your creations</h2>
        <Gallery images={images} onDelete={remove} deletingId={deletingId} />
      </main>
    </ErrorBoundary>
  );
}
