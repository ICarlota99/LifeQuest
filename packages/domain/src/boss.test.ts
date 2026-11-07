import { describe, expect, it } from "vitest";
import { applyBossDamage } from "./boss.js";
import { getPreset } from "./presets.js";

const config = getPreset("balanced");

describe("boss damage", () => {
  it("applies quest damage and completes phases", () => {
    const result = applyBossDamage(
      {
        maxHp: 100,
        currentHp: 100,
        status: "active",
        phases: [
          {
            id: "p1",
            hpThreshold: 50,
            name: "Phase 2",
            rewardsGranted: false,
          },
        ],
      },
      {
        source: "quest",
        difficulty: 4,
        habitChipDamageToday: 0,
      },
      config,
    );
    expect(result.damage).toBe(60);
    expect(result.currentHp).toBe(40);
    expect(result.phasesCompleted).toHaveLength(1);
  });

  it("caps habit chip damage", () => {
    const result = applyBossDamage(
      {
        maxHp: 100,
        currentHp: 100,
        status: "active",
        phases: [],
      },
      {
        source: "habit",
        difficulty: 1,
        habitChipDamageToday: 20,
        dailyHabitChipCap: 20,
      },
      config,
    );
    expect(result.skipped).toBe(true);
    expect(result.damage).toBe(0);
  });
});
