import { useEffect, useRef, useState } from "react";
import { playLevelUp, playSuccess, playUnlock } from "../lib/sounds.js";
import type { SuccessEvent } from "./useImages.js";

export interface Celebration {
  /** Confetti trigger for an ordinary success. */
  burstKey: number;
  /** Confetti trigger for a bigger level-up celebration. */
  bigBurstKey: number;
  /** Level number to show in the banner, or null. */
  levelUp: number | null;
  /** Floating "+XP" popup, or null. */
  xp: { id: number; amount: number } | null;
  /** Achievement ids to pulse this moment. */
  highlight: string[];
}

const IDLE: Celebration = { burstKey: 0, bigBurstKey: 0, levelUp: null, xp: null, highlight: [] };

/**
 * Turns a success event into transient celebration state (sounds + confetti +
 * popups) and auto-clears the visual bits after their animations.
 */
export function useCelebration(event: SuccessEvent | null): Celebration {
  const [state, setState] = useState<Celebration>(IDLE);
  const lastId = useRef(0);

  useEffect(() => {
    if (!event || event.id === lastId.current) return;
    lastId.current = event.id;

    if (event.leveledUpTo) playLevelUp();
    else if (event.unlocked.length) playUnlock();
    else playSuccess();

    setState({
      burstKey: event.id,
      bigBurstKey: event.leveledUpTo ? event.id : 0,
      levelUp: event.leveledUpTo,
      xp: { id: event.id, amount: event.xpGain },
      highlight: event.unlocked.map((a) => a.id),
    });
  }, [event]);

  useEffect(() => {
    if (state.levelUp === null) return;
    const t = setTimeout(() => setState((s) => ({ ...s, levelUp: null })), 2200);
    return () => clearTimeout(t);
  }, [state.levelUp]);

  useEffect(() => {
    if (!state.xp) return;
    const t = setTimeout(() => setState((s) => ({ ...s, xp: null })), 1300);
    return () => clearTimeout(t);
  }, [state.xp]);

  useEffect(() => {
    if (state.highlight.length === 0) return;
    const t = setTimeout(() => setState((s) => ({ ...s, highlight: [] })), 1300);
    return () => clearTimeout(t);
  }, [state.highlight]);

  return state;
}
