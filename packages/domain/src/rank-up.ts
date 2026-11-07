import { skillXpToNextRank } from "./formulas.js";
import { evaluateMilestoneGate } from "./milestones.js";
import { characterLevelFromXp } from "./formulas.js";
import type {
  LevelProgress,
  ProgressionConfig,
  RankProgress,
} from "./types.js";

export function getCharacterLevelProgress(
  totalXp: number,
  config: ProgressionConfig,
): LevelProgress {
  const result = characterLevelFromXp(totalXp, config);
  return {
    level: result.level,
    totalXp,
    xpIntoLevel: result.xpIntoLevel,
    xpToNext: result.xpToNext,
    progressRatio: result.progressRatio,
  };
}

function xpConsumedForRanks(rank: number, config: ProgressionConfig): number {
  let consumed = 0;
  for (let r = 0; r < rank; r += 1) {
    consumed += skillXpToNextRank(r, config);
  }
  return consumed;
}

export function getSkillRankProgress(
  totalXp: number,
  currentRank: number,
  completedMilestonesForNextRank: number,
  config: ProgressionConfig,
): RankProgress {
  const effectiveRank = Math.min(currentRank, config.maxSkillRank);
  const xpNeeded = skillXpToNextRank(effectiveRank, config);
  const consumed = xpConsumedForRanks(effectiveRank, config);
  const xpIntoRank = Math.max(0, totalXp - consumed);
  const eligibleForRankUp =
    effectiveRank < config.maxSkillRank && xpIntoRank >= xpNeeded;
  const gate = evaluateMilestoneGate(
    effectiveRank + 1,
    completedMilestonesForNextRank,
    config,
  );

  return {
    rank: effectiveRank,
    totalXp,
    xpIntoRank: xpNeeded > 0 ? Math.min(xpIntoRank, xpNeeded) : xpIntoRank,
    xpToNext: xpNeeded,
    progressRatio: xpNeeded === 0 ? 1 : Math.min(1, xpIntoRank / xpNeeded),
    eligibleForRankUp,
    blockedByMilestones: eligibleForRankUp && !gate.satisfied,
  };
}

/**
 * Returns the new rank if advancement is allowed; otherwise current rank.
 * Overflow XP is retained (caller keeps totalXp unchanged).
 */
export function tryAdvanceSkillRank(
  totalXp: number,
  currentRank: number,
  completedMilestonesForNextRank: number,
  config: ProgressionConfig,
): { newRank: number; advanced: boolean; blockedByMilestones: boolean } {
  const progress = getSkillRankProgress(
    totalXp,
    currentRank,
    completedMilestonesForNextRank,
    config,
  );
  if (!progress.eligibleForRankUp) {
    return {
      newRank: currentRank,
      advanced: false,
      blockedByMilestones: false,
    };
  }
  if (progress.blockedByMilestones) {
    return {
      newRank: currentRank,
      advanced: false,
      blockedByMilestones: true,
    };
  }
  return {
    newRank: currentRank + 1,
    advanced: true,
    blockedByMilestones: false,
  };
}
