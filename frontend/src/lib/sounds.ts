/**
 * Tiny Web Audio sound engine — synthesizes cheerful effects, so there are
 * no audio asset files to bundle or host. No-ops where Web Audio is
 * unavailable (e.g. jsdom in tests).
 */

let ctx: AudioContext | null = null;
let muted = false;

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function setMuted(value: boolean): void {
  muted = value;
}

export function isMuted(): boolean {
  return muted;
}

interface Note {
  freq: number;
  start: number;
  duration: number;
}

function play(notes: Note[], type: OscillatorType, gainLevel: number): void {
  const ac = audioContext();
  if (!ac || muted) return;
  const now = ac.currentTime;
  for (const note of notes) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.value = note.freq;
    const t0 = now + note.start;
    const t1 = t0 + note.duration;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(gainLevel, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t1);
    osc.connect(gain).connect(ac.destination);
    osc.start(t0);
    osc.stop(t1 + 0.03);
  }
}

/** Bright major arpeggio — played on each successful transform. */
export function playSuccess(): void {
  play(
    [
      { freq: 523.25, start: 0, duration: 0.12 },
      { freq: 659.25, start: 0.08, duration: 0.12 },
      { freq: 783.99, start: 0.16, duration: 0.18 },
    ],
    "triangle",
    0.12,
  );
}

/** Rising four-note fanfare — played when you level up. */
export function playLevelUp(): void {
  play(
    [
      { freq: 523.25, start: 0, duration: 0.12 },
      { freq: 659.25, start: 0.1, duration: 0.12 },
      { freq: 783.99, start: 0.2, duration: 0.12 },
      { freq: 1046.5, start: 0.3, duration: 0.3 },
    ],
    "sawtooth",
    0.09,
  );
}

/** Quick sparkle — played when an achievement unlocks. */
export function playUnlock(): void {
  play(
    [
      { freq: 880, start: 0, duration: 0.08 },
      { freq: 1318.51, start: 0.07, duration: 0.14 },
    ],
    "sine",
    0.13,
  );
}
