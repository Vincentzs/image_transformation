import { useCallback, useEffect, useRef, useState } from "react";
import * as api from "../api.js";
import type { ProcessedImage } from "../types.js";
import { ACHIEVEMENTS, levelFor, XP_PER_IMAGE, type Achievement } from "../lib/gamification.js";

export interface SuccessEvent {
  /** Unique per upload; drives celebration effects. */
  id: number;
  xpGain: number;
  /** The new level, if this upload crossed a level boundary; else null. */
  leveledUpTo: number | null;
  /** Achievements newly unlocked by this upload. */
  unlocked: Achievement[];
}

export interface UseImages {
  images: ProcessedImage[];
  latest: ProcessedImage | null;
  processing: boolean;
  deletingId: string | null;
  error: string | null;
  event: SuccessEvent | null;
  upload: (file: File) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

/**
 * Encapsulates gallery state, the API calls behind it, and the per-upload
 * success event used to drive game celebrations.
 */
export function useImages(): UseImages {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [latest, setLatest] = useState<ProcessedImage | null>(null);
  const [processing, setProcessing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [event, setEvent] = useState<SuccessEvent | null>(null);

  // Live count for computing level/achievement deltas without stale closures.
  const countRef = useRef(0);
  useEffect(() => {
    countRef.current = images.length;
  }, [images.length]);

  const refresh = useCallback(async (): Promise<ProcessedImage[] | null> => {
    try {
      const list = await api.listImages();
      setImages(list);
      return list;
    } catch (e) {
      setError(messageOf(e, "Failed to load images."));
      return null;
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
        const before = countRef.current;
        const result = await api.uploadImage(file);
        setLatest(result);
        const list = await refresh();
        const after = list ? list.length : before + 1;
        setEvent({
          id: Date.now(),
          xpGain: XP_PER_IMAGE,
          leveledUpTo: levelFor(after) > levelFor(before) ? levelFor(after) : null,
          unlocked: ACHIEVEMENTS.filter((a) => before < a.threshold && after >= a.threshold),
        });
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

  return { images, latest, processing, deletingId, error, event, upload, remove };
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
