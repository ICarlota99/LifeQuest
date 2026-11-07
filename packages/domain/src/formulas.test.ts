import { describe, expect, it } from "vitest";
import {
  characterLevelFromXp,
  characterXpToNextLevel,
  cumulativeXpForCharacterLevel,
  skillXpToNextRank,
  computeRawXp,
} from "./formulas.js";
import { getPreset } from "./presets.js";

const balanced = getPreset("balanced");

describe("character XP curve", () => {
  it("matches plan table for early levels", () => {
    expect(characterXpToNextLevel(1, balanced)).toBe(100);
    expect(characterXpToNextLevel(2, balanced)).toBe(
      Math.floor(100 * Math.pow(2, 1.5)),
    );
    expect(cumulativeXpForCharacterLevel(1, balanced)).toBe(0);
    expect(cumulativeXpForCharacterLevel(2, balanced)).toBe(100);
  });

  it("derives level from total XP", () => {
    expect(characterLevelFromXp(0, balanced).level).toBe(1);
    expect(characterLevelFromXp(99, balanced).level).toBe(1);
    expect(characterLevelFromXp(100, balanced).level).toBe(2);
  });
});

describe("skill XP curve", () => {
  it("scales with rank", () => {
    expect(skillXpToNextRank(0, balanced)).toBe(50);
    expect(skillXpToNextRank(1, balanced)).toBe(
      Math.floor(50 * Math.pow(2, 1.6)),
    );
  });
});

describe("raw XP", () => {
  it("uses sqrt effort", () => {
    expect(computeRawXp(3, 1)).toBe(30);
    expect(computeRawXp(3, 4)).toBe(60);
  });
});
