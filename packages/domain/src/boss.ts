import type { Difficulty, ProgressionConfig } from "./types.js";

export type BossDamageSource = "habit" | "quest";

export interface BossDamageInput {
  source: BossDamageSource;
  difficulty: Difficulty;
  /** Optional override; otherwise derived from config. */
  amount?: number;
  /** Habit chip damage already dealt to this boss today. */
  habitChipDamageToday: number;
  /** Daily cap for habit chip damage against a single boss. */
  dailyHabitChipCap?: number;
}

export interface BossPhase {
  id: string;
  /** HP threshold at or below which this phase becomes active (from max). */
  hpThreshold: number;
  name: string;
  rewardsGranted: boolean;
}

export interface BossState {
  maxHp: number;
  currentHp: number;
  status: "active" | "defeated" | "locked";
  phases: BossPhase[];
}

export interface BossDamageResult {
  damage: number;
  currentHp: number;
  defeated: boolean;
  phasesCompleted: BossPhase[];
  skipped: boolean;
  reason?: string;
}

export function calculateBossDamage(
  input: BossDamageInput,
  config: ProgressionConfig,
): number {
  if (input.amount !== undefined) return Math.max(0, Math.floor(input.amount));
  if (input.source === "habit") return config.habitBossChipDamage;
  return config.questBossDamagePerDifficulty * input.difficulty;
}

export function applyBossDamage(
  boss: BossState,
  input: BossDamageInput,
  config: ProgressionConfig,
): BossDamageResult {
  if (boss.status !== "active") {
    return {
      damage: 0,
      currentHp: boss.currentHp,
      defeated: boss.status === "defeated",
      phasesCompleted: [],
      skipped: true,
      reason: `Boss is ${boss.status}`,
    };
  }

  const dailyHabitChipCap = input.dailyHabitChipCap ?? 20;
  let damage = calculateBossDamage(input, config);

  if (input.source === "habit") {
    const remaining = Math.max(0, dailyHabitChipCap - input.habitChipDamageToday);
    damage = Math.min(damage, remaining);
    if (damage <= 0) {
      return {
        damage: 0,
        currentHp: boss.currentHp,
        defeated: false,
        phasesCompleted: [],
        skipped: true,
        reason: "Daily habit chip damage cap reached",
      };
    }
  }

  const previousHp = boss.currentHp;
  const currentHp = Math.max(0, previousHp - damage);
  const defeated = currentHp <= 0;

  const phasesCompleted = boss.phases.filter((phase) => {
    if (phase.rewardsGranted) return false;
    // Phase completes when HP crosses at or below threshold.
    return previousHp > phase.hpThreshold && currentHp <= phase.hpThreshold;
  });

  return {
    damage,
    currentHp,
    defeated,
    phasesCompleted,
    skipped: false,
  };
}
