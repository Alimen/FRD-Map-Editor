import { Difficulty } from "./types";

export const DIFFICULTIES: readonly Difficulty[] = [0, 1, 2, 3, 4, 5];
export const DEFAULT_DIFFICULTY: Difficulty = 0;

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  0: "#fef9c3",
  1: "#fde68a",
  2: "#fdba74",
  3: "#fb923c",
  4: "#f87171",
  5: "#dc2626",
};

export const parseDifficulty = (value: unknown): Difficulty => {
  if (value === undefined) return DEFAULT_DIFFICULTY;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 5) {
    throw new Error("困難度必須為 0～5 的整數");
  }
  return value as Difficulty;
};
