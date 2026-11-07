import { computeRawXp, clampEffortHours } from "./formulas.js";
import type {
  AwardInput,
  AwardResult,
  ProgressionConfig,
  SkillXpAward,
} from "./types.js";

function diminishingMultiplier(
  sameActivityCountToday: number,
  curve: number[],
): number {
  if (sameActivityCountToday < 0) return curve[0] ?? 0;
  if (sameActivityCountToday >= curve.length) {
    return curve[curve.length - 1] ?? 0;
  }
  return curve[sameActivityCountToday] ?? 0;
}

function streakBonus(
  softStreakDays: number,
  thresholds: number[],
  bonus: number,
): number {
  const hit = thresholds.some((t) => softStreakDays >= t);
  return hit ? bonus : 0;
}

function normalizeWeights(
  weights: AwardInput["skillWeights"],
): AwardInput["skillWeights"] {
  const positive = weights.filter((w) => w.weight > 0);
  const sum = positive.reduce((acc, w) => acc + w.weight, 0);
  if (sum <= 0) return [];
  return positive.map((w) => ({
    skillId: w.skillId,
    weight: w.weight / sum,
  }));
}

/**
 * Pure award calculator. Does not mutate state — caller persists ledgers.
 */
export function calculateAward(
  input: AwardInput,
  config: ProgressionConfig,
): AwardResult {
  const quality = input.quality ?? 1;
  const effortHours = clampEffortHours(input.effortHours);
  let raw = computeRawXp(input.difficulty, effortHours, quality);

  const dim = diminishingMultiplier(
    input.sameActivityCountToday,
    config.sameActivityDiminishing,
  );
  const streak = streakBonus(
    input.softStreakDays,
    config.softStreakThresholds,
    config.softStreakBonus,
  );

  raw = Math.round(raw * dim * (1 + streak));

  if (input.isWeeklyQuestRepeat) {
    raw = Math.round(raw * config.weeklyRepeatQuestMultiplier);
  }

  const remainingCharCap = Math.max(
    0,
    config.dailyCharacterXpCap - input.characterXpEarnedToday,
  );
  let characterXp = Math.min(
    remainingCharCap,
    Math.round(raw * config.mChar),
  );

  const weights = normalizeWeights(input.skillWeights);
  const skillXp: SkillXpAward[] = [];

  for (const w of weights) {
    const earnedToday = input.skillXpEarnedToday[w.skillId] ?? 0;
    const remainingSkillCap = Math.max(0, config.dailySkillXpCap - earnedToday);
    const amount = Math.min(
      remainingSkillCap,
      Math.round(raw * config.mSkill * w.weight),
    );
    if (amount > 0) {
      skillXp.push({ skillId: w.skillId, amount });
    }
  }

  const uncappedChar = Math.round(raw * config.mChar);
  const capped =
    characterXp < uncappedChar ||
    skillXp.some((s) => {
      const w = weights.find((x) => x.skillId === s.skillId);
      const ideal = Math.round(raw * config.mSkill * (w?.weight ?? 0));
      return s.amount < ideal;
    });

  return {
    raw,
    characterXp,
    skillXp,
    streakBonusApplied: streak,
    diminishingMultiplier: dim,
    capped,
    meta: {
      difficulty: input.difficulty,
      effortHours,
      quality,
      preset: config.preset,
      ruleVersion: config.version,
    },
  };
}
