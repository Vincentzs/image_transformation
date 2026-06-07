import { useImages } from "./hooks/useImages.js";
import { useCelebration } from "./hooks/useCelebration.js";
import { ErrorBoundary } from "./components/ErrorBoundary.js";
import { StatsBar } from "./components/StatsBar.js";
import { Achievements } from "./components/Achievements.js";
import { Confetti } from "./components/Confetti.js";
import { LevelUpBanner } from "./components/LevelUpBanner.js";
import { XpPopup } from "./components/XpPopup.js";
import { UploadDropzone } from "./components/UploadDropzone.js";
import { ProcessingState } from "./components/ProcessingState.js";
import { ResultCard } from "./components/ResultCard.js";
import { Gallery } from "./components/Gallery.js";
import styles from "./App.module.css";

export default function App() {
  const { images, latest, processing, deletingId, error, event, upload, remove } = useImages();
  const { burstKey, bigBurstKey, levelUp, xp, highlight } = useCelebration(event);

  return (
    <ErrorBoundary>
      <Confetti fireKey={burstKey} />
      <Confetti fireKey={bigBurstKey} pieces={170} />
      {xp && <XpPopup key={xp.id} amount={xp.amount} />}
      {levelUp !== null && <LevelUpBanner level={levelUp} />}

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
        <Achievements count={images.length} highlight={highlight} />

        <h2 className={styles.sectionTitle}>Your creations</h2>
        <Gallery images={images} onDelete={remove} deletingId={deletingId} />
      </main>
    </ErrorBoundary>
  );
}
