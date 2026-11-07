import type { ProgressionConfig } from "./types.js";

/** XP cost to advance from level L to L+1. */
export function characterXpToNextLevel(
  level: number,
  config: ProgressionConfig,
): number {
  if (level < 1) return config.characterLevelBase;
  return Math.floor(
    config.characterLevelBase * Math.pow(level, config.characterLevelExponent),
  );
}

/** Cumulative XP required to *be* at the given level (level 1 = 0). */
export function cumulativeXpForCharacterLevel(
  level: number,
  config: ProgressionConfig,
): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let l = 1; l < level; l += 1) {
    total += characterXpToNextLevel(l, config);
  }
  return total;
}

export function characterLevelFromXp(
  totalXp: number,
  config: ProgressionConfig,
): {
  level: number;
  xpIntoLevel: number;
  xpToNext: number;
  progressRatio: number;
} {
  let level = 1;
  let remaining = Math.max(0, totalXp);
  // Safety bound — levels remain meaningful for years of play.
  while (level < 200) {
    const need = characterXpToNextLevel(level, config);
    if (remaining < need) {
      return {
        level,
        xpIntoLevel: remaining,
        xpToNext: need,
        progressRatio: need === 0 ? 1 : remaining / need,
      };
    }
    remaining -= need;
    level += 1;
  }
  return { level, xpIntoLevel: remaining, xpToNext: 0, progressRatio: 1 };
}

/** XP cost to advance from rank R to R+1. */
export function skillXpToNextRank(
  rank: number,
  config: ProgressionConfig,
): number {
  return Math.floor(
    config.skillRankBase * Math.pow(rank + 1, config.skillRankExponent),
  );
}

export function cumulativeXpForSkillRank(
  rank: number,
  config: ProgressionConfig,
): number {
  if (rank <= 0) return 0;
  let total = 0;
  for (let r = 0; r < rank; r += 1) {
    total += skillXpToNextRank(r, config);
  }
  return total;
}

export function skillRankFromXp(
  totalXp: number,
  config: ProgressionConfig,
): {
  rank: number;
  xpIntoRank: number;
  xpToNext: number;
  progressRatio: number;
} {
  let rank = 0;
  let remaining = Math.max(0, totalXp);
  while (rank < config.maxSkillRank) {
    const need = skillXpToNextRank(rank, config);
    if (remaining < need) {
      return {
        rank,
        xpIntoRank: remaining,
        xpToNext: need,
        progressRatio: need === 0 ? 1 : remaining / need,
      };
    }
    remaining -= need;
    rank += 1;
  }
  return { rank, xpIntoRank: remaining, xpToNext: 0, progressRatio: 1 };
}

export function clampEffortHours(effortHours: number): number {
  return Math.min(4, Math.max(0.25, effortHours));
}

export function computeRawXp(
  difficulty: number,
  effortHours: number,
  quality = 1,
): number {
  const e = clampEffortHours(effortHours);
  const q = Math.min(1.2, Math.max(0.8, quality));
  const d = Math.min(5, Math.max(1, difficulty));
  return Math.round(10 * d * Math.sqrt(e) * q);
}
