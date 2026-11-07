import type { MilestoneGateEvaluation, ProgressionConfig } from "./types.js";

/**
 * Required completed milestones to advance TO the given nextRank.
 * Returns 0 when gates are disabled or nextRank is below the gate threshold.
 */
export function requiredMilestonesForRank(
  nextRank: number,
  config: ProgressionConfig,
): number {
  if (config.milestoneGateFromRank === null) return 0;
  if (nextRank < config.milestoneGateFromRank) return 0;
  return Math.ceil(nextRank / 2);
}

export function evaluateMilestoneGate(
  nextRank: number,
  completedMilestoneCount: number,
  config: ProgressionConfig,
): MilestoneGateEvaluation {
  const requiredCount = requiredMilestonesForRank(nextRank, config);
  return {
    requiredCount,
    completedCount: completedMilestoneCount,
    satisfied: completedMilestoneCount >= requiredCount,
  };
}
