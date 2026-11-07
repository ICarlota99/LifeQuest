import type { ProgressionConfig, ProgressionPreset } from "./types.js";

const base: Omit<
  ProgressionConfig,
  | "preset"
  | "mChar"
  | "mSkill"
  | "dailyCharacterXpCap"
  | "sameActivityDiminishing"
  | "milestoneGateFromRank"
  | "softStreakThresholds"
  | "softStreakBonus"
> = {
  version: 1,
  dailySkillXpCap: 200,
  characterLevelExponent: 1.5,
  characterLevelBase: 100,
  skillRankExponent: 1.6,
  skillRankBase: 50,
  maxSkillRank: 10,
  habitBossChipDamage: 5,
  questBossDamagePerDifficulty: 15,
  weeklyRepeatQuestMultiplier: 0.25,
};

export const PRESETS: Record<ProgressionPreset, ProgressionConfig> = {
  casual: {
    ...base,
    preset: "casual",
    mChar: 1.35,
    mSkill: 1.35,
    dailyCharacterXpCap: 400,
    sameActivityDiminishing: [1, 0.7, 0.4, 0],
    milestoneGateFromRank: null,
    softStreakThresholds: [3, 7, 14],
    softStreakBonus: 0.1,
  },
  balanced: {
    ...base,
    preset: "balanced",
    mChar: 1.0,
    mSkill: 1.0,
    dailyCharacterXpCap: 250,
    sameActivityDiminishing: [1, 0.5, 0.25, 0],
    milestoneGateFromRank: 3,
    softStreakThresholds: [7, 21],
    softStreakBonus: 0.1,
  },
  hardcore: {
    ...base,
    preset: "hardcore",
    mChar: 0.7,
    mSkill: 0.75,
    dailyCharacterXpCap: 150,
    sameActivityDiminishing: [1, 0.4, 0],
    milestoneGateFromRank: 2,
    softStreakThresholds: [14],
    softStreakBonus: 0.05,
  },
};

export function getPreset(preset: ProgressionPreset): ProgressionConfig {
  return { ...PRESETS[preset] };
}

export function mergeConfigOverrides(
  preset: ProgressionPreset,
  overrides: Partial<ProgressionConfig> = {},
): ProgressionConfig {
  return { ...PRESETS[preset], ...overrides, preset };
}
