import type { Difficulty } from "./types.js";

export interface GoldAwardInput {
  difficulty: Difficulty;
  baseGold?: number;
  /** Soft streak days for a small gold bonus (not punitive). */
  softStreakDays?: number;
}

export interface GoldAwardResult {
  amount: number;
}

/** Simple gold economy: 5 * difficulty, +10% at 7-day soft streak. */
export function calculateGoldAward(input: GoldAwardInput): GoldAwardResult {
  const base = input.baseGold ?? 5 * input.difficulty;
  const streak = input.softStreakDays ?? 0;
  const bonus = streak >= 7 ? 0.1 : 0;
  return { amount: Math.round(base * (1 + bonus)) };
}

export type ItemRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary";

export interface ItemRewardBlueprint {
  name: string;
  description: string;
  rarity: ItemRarity;
  category: string;
  quantity?: number;
  bonuses?: Record<string, unknown>;
}
