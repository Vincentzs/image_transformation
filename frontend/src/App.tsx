import { useEffect, useState } from "react";
import * as api from "./api.js";
import type { ProcessedImage } from "./types.js";
import { UploadDropzone } from "./components/UploadDropzone.js";
import { ProcessingState } from "./components/ProcessingState.js";
import { ResultCard } from "./components/ResultCard.js";
import { Gallery } from "./components/Gallery.js";

export default function App() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [latest, setLatest] = useState<ProcessedImage | null>(null);
  const [processing, setProcessing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setImages(await api.listImages());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load images.");
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleUpload(file: File) {
    setError(null);
    setLatest(null);
    setProcessing(true);
    try {
      const result = await api.uploadImage(file);
      setLatest(result);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setProcessing(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    setDeletingId(id);
    try {
      await api.deleteImage(id);
      if (latest?.id === id) setLatest(null);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: 28 }}>Image Transformer</h1>
      <p style={{ color: "#6b7280", marginTop: -8 }}>
        Upload an image — we remove the background and flip it horizontally.
      </p>

      <UploadDropzone onFileSelected={handleUpload} disabled={processing} />

      {processing && <ProcessingState />}

      {error && (
        <div role="alert" style={{ color: "#b91c1c", marginTop: 12 }}>
          {error}
        </div>
      )}

      {latest && <ResultCard image={latest} />}

      <h2 style={{ fontSize: 20, marginTop: "2rem" }}>Your images</h2>
      <Gallery images={images} onDelete={handleDelete} deletingId={deletingId} />
    </main>
  );
}
