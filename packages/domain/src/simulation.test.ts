import { describe, expect, it } from "vitest";
import { calculateAward } from "./awards.js";
import { characterLevelFromXp, skillRankFromXp } from "./formulas.js";
import { getPreset } from "./presets.js";
import type { ProgressionConfig } from "./types.js";

/**
 * Golden-ish simulation: one habit/day at D3 E1 for N days on a single skill.
 */
function simulateDays(days: number, config: ProgressionConfig) {
  let characterXp = 0;
  let skillXp = 0;
  let softStreak = 0;

  for (let day = 0; day < days; day += 1) {
    softStreak += 1;
    const award = calculateAward(
      {
        difficulty: 3,
        effortHours: 1,
        skillWeights: [{ skillId: "learning", weight: 1 }],
        sameActivityCountToday: 0,
        softStreakDays: softStreak,
        characterXpEarnedToday: 0,
        skillXpEarnedToday: {},
      },
      config,
    );
    characterXp += award.characterXp;
    skillXp += award.skillXp[0]?.amount ?? 0;
  }

  return {
    characterXp,
    skillXp,
    level: characterLevelFromXp(characterXp, config).level,
    rank: skillRankFromXp(skillXp, config).rank,
  };
}

describe("progression simulations", () => {
  it("balanced ~7 days lands near level 2–3 / rank 1–2", () => {
    const result = simulateDays(7, getPreset("balanced"));
    expect(result.level).toBeGreaterThanOrEqual(2);
    expect(result.level).toBeLessThanOrEqual(3);
    expect(result.rank).toBeGreaterThanOrEqual(1);
    expect(result.rank).toBeLessThanOrEqual(3);
  });

  it("30-day balanced stays meaningful without exploding", () => {
    const result = simulateDays(30, getPreset("balanced"));
    expect(result.level).toBeGreaterThanOrEqual(3);
    expect(result.level).toBeLessThanOrEqual(8);
    expect(result.rank).toBeLessThanOrEqual(6);
  });

  it("90-day hardcore is slower than casual", () => {
    const casual = simulateDays(90, getPreset("casual"));
    const hardcore = simulateDays(90, getPreset("hardcore"));
    expect(casual.level).toBeGreaterThan(hardcore.level);
    expect(casual.characterXp).toBeGreaterThan(hardcore.characterXp);
  });
});
