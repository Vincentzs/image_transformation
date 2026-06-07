import { describe, it, expect } from "vitest";
import {
  ACHIEVEMENTS,
  isUnlocked,
  levelFor,
  levelProgress,
  PER_LEVEL,
  xpFor,
} from "../src/lib/gamification.js";

describe("gamification", () => {
  it("awards XP per image", () => {
    expect(xpFor(0)).toBe(0);
    expect(xpFor(4)).toBe(40);
  });

  it("levels up every PER_LEVEL images, starting at level 1", () => {
    expect(levelFor(0)).toBe(1);
    expect(levelFor(PER_LEVEL - 1)).toBe(1);
    expect(levelFor(PER_LEVEL)).toBe(2);
    expect(levelFor(PER_LEVEL * 2)).toBe(3);
  });

  it("reports progress within the current level", () => {
    expect(levelProgress(0)).toBe(0);
    expect(levelProgress(PER_LEVEL + 1)).toBe(1);
  });

  it("unlocks achievements once the count reaches the threshold", () => {
    const first = ACHIEVEMENTS[0];
    expect(isUnlocked(first, first.threshold - 1)).toBe(false);
    expect(isUnlocked(first, first.threshold)).toBe(true);
  });
});
