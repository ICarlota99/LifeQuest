import { describe, expect, it } from "vitest";
import { calculateAward } from "./awards.js";
import { getPreset } from "./presets.js";

const balanced = getPreset("balanced");
const casual = getPreset("casual");
const hardcore = getPreset("hardcore");

describe("calculateAward", () => {
  it("splits skill XP by weight", () => {
    const result = calculateAward(
      {
        difficulty: 3,
        effortHours: 1,
        skillWeights: [
          { skillId: "a", weight: 0.5 },
          { skillId: "b", weight: 0.5 },
        ],
        sameActivityCountToday: 0,
        softStreakDays: 0,
        characterXpEarnedToday: 0,
        skillXpEarnedToday: {},
      },
      balanced,
    );
    expect(result.raw).toBe(30);
    expect(result.characterXp).toBe(30);
    expect(result.skillXp).toEqual([
      { skillId: "a", amount: 15 },
      { skillId: "b", amount: 15 },
    ]);
  });

  it("applies diminishing returns", () => {
    const first = calculateAward(
      {
        difficulty: 2,
        effortHours: 1,
        skillWeights: [{ skillId: "a", weight: 1 }],
        sameActivityCountToday: 0,
        softStreakDays: 0,
        characterXpEarnedToday: 0,
        skillXpEarnedToday: {},
      },
      balanced,
    );
    const third = calculateAward(
      {
        difficulty: 2,
        effortHours: 1,
        skillWeights: [{ skillId: "a", weight: 1 }],
        sameActivityCountToday: 2,
        softStreakDays: 0,
        characterXpEarnedToday: 0,
        skillXpEarnedToday: {},
      },
      balanced,
    );
    expect(third.characterXp).toBeLessThan(first.characterXp);
    expect(third.diminishingMultiplier).toBe(0.25);
  });

  it("enforces daily character cap", () => {
    const result = calculateAward(
      {
        difficulty: 5,
        effortHours: 4,
        skillWeights: [{ skillId: "a", weight: 1 }],
        sameActivityCountToday: 0,
        softStreakDays: 0,
        characterXpEarnedToday: 240,
        skillXpEarnedToday: {},
      },
      balanced,
    );
    expect(result.characterXp).toBe(10);
    expect(result.capped).toBe(true);
  });

  it("casual awards more than hardcore", () => {
    const input = {
      difficulty: 3 as const,
      effortHours: 1,
      skillWeights: [{ skillId: "a", weight: 1 }],
      sameActivityCountToday: 0,
      softStreakDays: 0,
      characterXpEarnedToday: 0,
      skillXpEarnedToday: {},
    };
    const c = calculateAward(input, casual);
    const h = calculateAward(input, hardcore);
    expect(c.characterXp).toBeGreaterThan(h.characterXp);
  });
});
