/** Pure game-stat logic, derived from how many images you've created. */

export const PER_LEVEL = 3;
export const XP_PER_IMAGE = 10;

export const xpFor = (count: number): number => count * XP_PER_IMAGE;
export const levelFor = (count: number): number => Math.floor(count / PER_LEVEL) + 1;
/** Images completed toward the current level (0 .. PER_LEVEL - 1). */
export const levelProgress = (count: number): number => count % PER_LEVEL;

export interface Achievement {
  id: string;
  label: string;
  icon: string;
  threshold: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first", label: "First Magic", icon: "🎉", threshold: 1 },
  { id: "streak", label: "Hot Streak", icon: "🔥", threshold: 3 },
  { id: "pro", label: "Pro Editor", icon: "⭐", threshold: 5 },
  { id: "legend", label: "Legend", icon: "👑", threshold: 10 },
];

export const isUnlocked = (achievement: Achievement, count: number): boolean =>
  count >= achievement.threshold;
