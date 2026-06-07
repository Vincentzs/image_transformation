import { useCallback, useEffect, useState } from "react";
import * as api from "../api.js";
import type { ProcessedImage } from "../types.js";

export interface UseImages {
  images: ProcessedImage[];
  latest: ProcessedImage | null;
  processing: boolean;
  deletingId: string | null;
  error: string | null;
  /** Increments on each successful upload — drives the confetti burst. */
  successCount: number;
  upload: (file: File) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

/**
 * Encapsulates all gallery state and the API calls behind it, so view
 * components stay presentational and this logic is testable in isolation.
 */
export function useImages(): UseImages {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [latest, setLatest] = useState<ProcessedImage | null>(null);
  const [processing, setProcessing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      setImages(await api.listImages());
    } catch (e) {
      setError(messageOf(e, "Failed to load images."));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const upload = useCallback(
    async (file: File) => {
      setError(null);
      setLatest(null);
      setProcessing(true);
      try {
        const result = await api.uploadImage(file);
        setLatest(result);
        setSuccessCount((n) => n + 1);
        await refresh();
      } catch (e) {
        setError(messageOf(e, "Upload failed."));
      } finally {
        setProcessing(false);
      }
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      setError(null);
      setDeletingId(id);
      try {
        await api.deleteImage(id);
        setLatest((current) => (current?.id === id ? null : current));
        await refresh();
      } catch (e) {
        setError(messageOf(e, "Delete failed."));
      } finally {
        setDeletingId(null);
      }
    },
    [refresh],
  );

  return { images, latest, processing, deletingId, error, successCount, upload, remove };
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
