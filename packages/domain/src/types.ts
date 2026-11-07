export type ProgressionPreset = "casual" | "balanced" | "hardcore";

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export interface ProgressionConfig {
  preset: ProgressionPreset;
  version: number;
  mChar: number;
  mSkill: number;
  dailyCharacterXpCap: number;
  dailySkillXpCap: number;
  /** Multipliers applied to the Nth same-activity completion in a day (0-indexed). */
  sameActivityDiminishing: number[];
  /** Rank at which milestone gates become required (inclusive next rank). */
  milestoneGateFromRank: number | null;
  softStreakThresholds: number[];
  softStreakBonus: number;
  characterLevelExponent: number;
  characterLevelBase: number;
  skillRankExponent: number;
  skillRankBase: number;
  maxSkillRank: number;
  habitBossChipDamage: number;
  questBossDamagePerDifficulty: number;
  weeklyRepeatQuestMultiplier: number;
}

export interface SkillWeight {
  skillId: string;
  weight: number;
}

export interface AwardInput {
  difficulty: Difficulty;
  effortHours: number;
  quality?: number;
  skillWeights: SkillWeight[];
  /** How many times this same activity source was already awarded today (before this one). */
  sameActivityCountToday: number;
  softStreakDays: number;
  characterXpEarnedToday: number;
  skillXpEarnedToday: Record<string, number>;
  isWeeklyQuestRepeat?: boolean;
}

export interface SkillXpAward {
  skillId: string;
  amount: number;
}

export interface AwardResult {
  raw: number;
  characterXp: number;
  skillXp: SkillXpAward[];
  streakBonusApplied: number;
  diminishingMultiplier: number;
  capped: boolean;
  meta: {
    difficulty: Difficulty;
    effortHours: number;
    quality: number;
    preset: ProgressionPreset;
    ruleVersion: number;
  };
}

export interface LevelProgress {
  level: number;
  totalXp: number;
  xpIntoLevel: number;
  xpToNext: number;
  progressRatio: number;
}

export interface RankProgress {
  rank: number;
  totalXp: number;
  xpIntoRank: number;
  xpToNext: number;
  progressRatio: number;
  eligibleForRankUp: boolean;
  blockedByMilestones: boolean;
}

export interface MilestoneGateEvaluation {
  requiredCount: number;
  completedCount: number;
  satisfied: boolean;
}

export const MAX_ATTRIBUTES = 6;
export const MAX_SKILLS_PER_ATTRIBUTE = 6;
