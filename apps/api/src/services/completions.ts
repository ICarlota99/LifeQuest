import { and, eq, gte, sql } from "drizzle-orm";
import {
  bossPhases,
  bosses,
  characters,
  completions,
  goldTransactions,
  habitCompletions,
  habitSkillLinks,
  habits,
  inventoryItems,
  milestones,
  newId,
  questSkillLinks,
  quests,
  skills,
  xpTransactions,
} from "@lifequest/db";
import {
  applyBossDamage,
  calculateAward,
  calculateGoldAward,
  getCharacterLevelProgress,
  tryAdvanceSkillRank,
  type Difficulty,
} from "@lifequest/domain";
import { db } from "../db.js";
import { todayInTimezone } from "../lib/dates.js";
import { HttpError } from "../lib/errors.js";
import { getOrCreateActiveRuleSet } from "./progression-settings.js";

type CompletionSource = "habit" | "quest";

export async function completeActivity(
  userId: string,
  timezone: string,
  input: {
    sourceType: CompletionSource;
    sourceId: string;
    idempotencyKey: string;
    effortHours?: number;
    quality?: number;
    note?: string;
  },
) {
  const existing = await db.query.completions.findFirst({
    where: and(
      eq(completions.userId, userId),
      eq(completions.idempotencyKey, input.idempotencyKey),
    ),
  });
  if (existing) {
    return { duplicate: true as const, completion: existing };
  }

  const occurredOn = todayInTimezone(timezone);
  const { row: ruleSet, config } = await getOrCreateActiveRuleSet(userId);

  if (input.sourceType === "habit") {
    return completeHabit(userId, timezone, occurredOn, ruleSet.id, config, input);
  }
  return completeQuest(userId, timezone, occurredOn, ruleSet.id, config, input);
}

async function completeHabit(
  userId: string,
  _timezone: string,
  occurredOn: string,
  ruleSetId: string,
  config: Awaited<ReturnType<typeof getOrCreateActiveRuleSet>>["config"],
  input: {
    sourceId: string;
    idempotencyKey: string;
    effortHours?: number;
    quality?: number;
    note?: string;
  },
) {
  const habit = await db.query.habits.findFirst({
    where: and(eq(habits.id, input.sourceId), eq(habits.userId, userId)),
  });
  if (!habit) throw new HttpError(404, "Habit not found");
  if (habit.status !== "active") {
    throw new HttpError(400, "Habit is not active");
  }

  const already = await db.query.habitCompletions.findFirst({
    where: and(
      eq(habitCompletions.habitId, habit.id),
      eq(habitCompletions.occurredOn, occurredOn),
    ),
  });
  if (already) {
    throw new HttpError(409, "Habit already completed today");
  }

  const links = await db.query.habitSkillLinks.findMany({
    where: eq(habitSkillLinks.habitId, habit.id),
  });

  const { campaigns } = await import("@lifequest/db");
  const campaign = await db.query.campaigns.findFirst({
    where: and(
      eq(campaigns.id, habit.campaignId),
      eq(campaigns.userId, userId),
    ),
  });
  if (!campaign) throw new HttpError(404, "Campaign not found");

  return applyRewards({
    userId,
    characterId: campaign.characterId,
    sourceType: "habit",
    sourceId: habit.id,
    difficulty: habit.difficulty as Difficulty,
    effortHours: input.effortHours ?? habit.estimatedEffortHours,
    quality: input.quality,
    note: input.note,
    idempotencyKey: input.idempotencyKey,
    occurredOn,
    ruleSetId,
    config,
    skillWeights: links.map((l) => ({
      skillId: l.skillId,
      weight: l.weight / 100,
    })),
    softStreakDays: habit.softStreak + 1,
    goldOverride: habit.goldReward,
    bossId: habit.bossId,
    onSuccessSideEffects: async (tx, completionId) => {
      await tx.insert(habitCompletions).values({
        id: newId("hcomp"),
        userId,
        habitId: habit.id,
        occurredOn,
        completionId,
      });
      await tx
        .update(habits)
        .set({ softStreak: habit.softStreak + 1, updatedAt: new Date() })
        .where(eq(habits.id, habit.id));
    },
  });
}

async function completeQuest(
  userId: string,
  _timezone: string,
  occurredOn: string,
  ruleSetId: string,
  config: Awaited<ReturnType<typeof getOrCreateActiveRuleSet>>["config"],
  input: {
    sourceId: string;
    idempotencyKey: string;
    effortHours?: number;
    quality?: number;
    note?: string;
  },
) {
  const quest = await db.query.quests.findFirst({
    where: and(eq(quests.id, input.sourceId), eq(quests.userId, userId)),
  });
  if (!quest) throw new HttpError(404, "Quest not found");
  if (quest.status === "completed") {
    throw new HttpError(409, "Quest already completed");
  }

  const { campaigns } = await import("@lifequest/db");
  const campaign = await db.query.campaigns.findFirst({
    where: and(eq(campaigns.id, quest.campaignId), eq(campaigns.userId, userId)),
  });
  if (!campaign) throw new HttpError(404, "Campaign not found");

  const links = await db.query.questSkillLinks.findMany({
    where: eq(questSkillLinks.questId, quest.id),
  });

  const isWeeklyRepeat =
    quest.questType === "weekly" && quest.status === "available"
      ? false
      : quest.questType === "weekly";

  return applyRewards({
    userId,
    characterId: campaign.characterId,
    sourceType: "quest",
    sourceId: quest.id,
    difficulty: quest.difficulty as Difficulty,
    effortHours: input.effortHours ?? quest.estimatedEffortHours,
    quality: input.quality,
    note: input.note,
    idempotencyKey: input.idempotencyKey,
    occurredOn,
    ruleSetId,
    config,
    skillWeights: links.map((l) => ({
      skillId: l.skillId,
      weight: l.weight / 100,
    })),
    softStreakDays: 0,
    goldOverride: quest.goldReward,
    bossId: quest.bossId,
    isWeeklyQuestRepeat: isWeeklyRepeat,
    itemRewards: quest.itemRewards as Array<Record<string, unknown>>,
    onSuccessSideEffects: async (tx) => {
      await tx
        .update(quests)
        .set({
          status: "completed",
          progress: 100,
          updatedAt: new Date(),
        })
        .where(eq(quests.id, quest.id));
    },
  });
}

async function applyRewards(args: {
  userId: string;
  characterId: string;
  sourceType: CompletionSource;
  sourceId: string;
  difficulty: Difficulty;
  effortHours: number;
  quality?: number;
  note?: string;
  idempotencyKey: string;
  occurredOn: string;
  ruleSetId: string;
  config: Awaited<ReturnType<typeof getOrCreateActiveRuleSet>>["config"];
  skillWeights: Array<{ skillId: string; weight: number }>;
  softStreakDays: number;
  goldOverride?: number | null;
  bossId?: string | null;
  isWeeklyQuestRepeat?: boolean;
  itemRewards?: Array<Record<string, unknown>>;
  onSuccessSideEffects: (
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    completionId: string,
  ) => Promise<void>;
}) {
  const dayStart = new Date(`${args.occurredOn}T00:00:00.000Z`);

  const sameActivityCountToday = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(completions)
    .where(
      and(
        eq(completions.userId, args.userId),
        eq(completions.sourceType, args.sourceType),
        eq(completions.sourceId, args.sourceId),
        gte(completions.createdAt, dayStart),
      ),
    )
    .then((r) => Number(r[0]?.value ?? 0));

  const characterXpEarnedToday = await db
    .select({ value: sql<number>`coalesce(sum(${xpTransactions.amount}),0)::int` })
    .from(xpTransactions)
    .where(
      and(
        eq(xpTransactions.userId, args.userId),
        eq(xpTransactions.characterId, args.characterId),
        eq(xpTransactions.xpKind, "character"),
        gte(xpTransactions.createdAt, dayStart),
      ),
    )
    .then((r) => Number(r[0]?.value ?? 0));

  const skillXpRows = await db
    .select({
      skillId: xpTransactions.skillId,
      value: sql<number>`coalesce(sum(${xpTransactions.amount}),0)::int`,
    })
    .from(xpTransactions)
    .where(
      and(
        eq(xpTransactions.userId, args.userId),
        eq(xpTransactions.xpKind, "skill"),
        gte(xpTransactions.createdAt, dayStart),
      ),
    )
    .groupBy(xpTransactions.skillId);

  const skillXpEarnedToday: Record<string, number> = {};
  for (const row of skillXpRows) {
    if (row.skillId) skillXpEarnedToday[row.skillId] = Number(row.value);
  }

  const award = calculateAward(
    {
      difficulty: args.difficulty,
      effortHours: args.effortHours,
      quality: args.quality,
      skillWeights: args.skillWeights,
      sameActivityCountToday,
      softStreakDays: args.softStreakDays,
      characterXpEarnedToday,
      skillXpEarnedToday,
      isWeeklyQuestRepeat: args.isWeeklyQuestRepeat,
    },
    args.config,
  );

  const gold = calculateGoldAward({
    difficulty: args.difficulty,
    baseGold: args.goldOverride ?? undefined,
    softStreakDays: args.softStreakDays,
  });

  const completionId = newId("comp");

  const result = await db.transaction(async (tx) => {
    const [completion] = await tx
      .insert(completions)
      .values({
        id: completionId,
        userId: args.userId,
        characterId: args.characterId,
        sourceType: args.sourceType,
        sourceId: args.sourceId,
        idempotencyKey: args.idempotencyKey,
        difficulty: args.difficulty,
        effortHours: Math.max(1, Math.round(args.effortHours)),
        note: args.note,
        occurredOn: args.occurredOn,
        metaJson: { award, gold },
      })
      .returning();

    if (award.characterXp > 0) {
      await tx.insert(xpTransactions).values({
        id: newId("xp"),
        userId: args.userId,
        characterId: args.characterId,
        completionId,
        ruleSetId: args.ruleSetId,
        sourceType: args.sourceType,
        sourceId: args.sourceId,
        amount: award.characterXp,
        xpKind: "character",
        idempotencyKey: `${args.idempotencyKey}:char`,
        metaJson: award.meta as unknown as Record<string, unknown>,
      });
    }

    for (const skillAward of award.skillXp) {
      await tx.insert(xpTransactions).values({
        id: newId("xp"),
        userId: args.userId,
        characterId: args.characterId,
        skillId: skillAward.skillId,
        completionId,
        ruleSetId: args.ruleSetId,
        sourceType: args.sourceType,
        sourceId: args.sourceId,
        amount: skillAward.amount,
        xpKind: "skill",
        idempotencyKey: `${args.idempotencyKey}:skill:${skillAward.skillId}`,
        metaJson: award.meta as unknown as Record<string, unknown>,
      });

      const skill = await tx.query.skills.findFirst({
        where: and(
          eq(skills.id, skillAward.skillId),
          eq(skills.userId, args.userId),
        ),
      });
      if (!skill) continue;

      const newXp = skill.skillXp + skillAward.amount;
      const completedMilestones = await tx
        .select({ value: sql<number>`count(*)::int` })
        .from(milestones)
        .where(
          and(
            eq(milestones.userId, args.userId),
            eq(milestones.subjectType, "skill"),
            eq(milestones.subjectId, skill.id),
            eq(milestones.status, "completed"),
          ),
        )
        .then((r) => Number(r[0]?.value ?? 0));

      const advance = tryAdvanceSkillRank(
        newXp,
        skill.rank,
        completedMilestones,
        args.config,
      );

      await tx
        .update(skills)
        .set({
          skillXp: newXp,
          rank: advance.newRank,
          updatedAt: new Date(),
        })
        .where(eq(skills.id, skill.id));
    }

    const character = await tx.query.characters.findFirst({
      where: and(
        eq(characters.id, args.characterId),
        eq(characters.userId, args.userId),
      ),
    });
    if (!character) throw new HttpError(404, "Character not found");

    const newCharXp = character.characterXp + award.characterXp;
    const levelProgress = getCharacterLevelProgress(newCharXp, args.config);

    await tx
      .update(characters)
      .set({
        characterXp: newCharXp,
        level: levelProgress.level,
        updatedAt: new Date(),
      })
      .where(eq(characters.id, character.id));

    if (gold.amount > 0) {
      await tx.insert(goldTransactions).values({
        id: newId("gold"),
        userId: args.userId,
        characterId: args.characterId,
        completionId,
        sourceType: args.sourceType,
        sourceId: args.sourceId,
        amount: gold.amount,
        idempotencyKey: `${args.idempotencyKey}:gold`,
        memo: `Reward for ${args.sourceType}`,
      });
    }

    const grantedItems = [];
    for (const item of args.itemRewards ?? []) {
      const [created] = await tx
        .insert(inventoryItems)
        .values({
          id: newId("item"),
          userId: args.userId,
          characterId: args.characterId,
          name: String(item.name ?? "Reward"),
          description: String(item.description ?? ""),
          rarity: String(item.rarity ?? "common"),
          category: String(item.category ?? "collectible"),
          quantity: Number(item.quantity ?? 1),
          bonusesJson: (item.bonuses as Record<string, unknown>) ?? {},
          sourceQuestId: args.sourceType === "quest" ? args.sourceId : null,
        })
        .returning();
      grantedItems.push(created!);
    }

    let bossResult = null;
    if (args.bossId) {
      bossResult = await damageBossInTx(
        tx,
        args.userId,
        args.bossId,
        args.sourceType,
        args.difficulty,
        args.occurredOn,
        args.config,
        args.characterId,
        args.idempotencyKey,
      );
    }

    await args.onSuccessSideEffects(tx, completionId);

    return {
      duplicate: false as const,
      completion: completion!,
      award,
      gold,
      levelProgress,
      grantedItems,
      bossResult,
    };
  });

  return result;
}

async function damageBossInTx(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  userId: string,
  bossId: string,
  sourceType: CompletionSource,
  difficulty: Difficulty,
  occurredOn: string,
  config: Awaited<ReturnType<typeof getOrCreateActiveRuleSet>>["config"],
  characterId: string,
  idempotencyKey: string,
) {
  const boss = await tx.query.bosses.findFirst({
    where: and(eq(bosses.id, bossId), eq(bosses.userId, userId)),
  });
  if (!boss || boss.status !== "active") return null;

  let habitChipToday = boss.habitChipDamageToday;
  if (boss.habitChipDate !== occurredOn) {
    habitChipToday = 0;
  }

  const phases = await tx.query.bossPhases.findMany({
    where: eq(bossPhases.bossId, boss.id),
  });

  const damageResult = applyBossDamage(
    {
      maxHp: boss.maxHp,
      currentHp: boss.currentHp,
      status: boss.status as "active" | "defeated" | "locked",
      phases: phases.map((p) => ({
        id: p.id,
        hpThreshold: p.hpThreshold,
        name: p.name,
        rewardsGranted: p.rewardsGranted === 1,
      })),
    },
    {
      source: sourceType,
      difficulty,
      habitChipDamageToday: habitChipToday,
    },
    config,
  );

  if (damageResult.skipped) return damageResult;

  await tx
    .update(bosses)
    .set({
      currentHp: damageResult.currentHp,
      status: damageResult.defeated ? "defeated" : "active",
      habitChipDamageToday:
        sourceType === "habit"
          ? habitChipToday + damageResult.damage
          : habitChipToday,
      habitChipDate: occurredOn,
      updatedAt: new Date(),
    })
    .where(eq(bosses.id, boss.id));

  for (const phase of damageResult.phasesCompleted) {
    await tx
      .update(bossPhases)
      .set({ rewardsGranted: 1 })
      .where(eq(bossPhases.id, phase.id));

    const phaseRow = phases.find((p) => p.id === phase.id);
    const rewards = (phaseRow?.rewardsJson ?? {}) as {
      gold?: number;
      item?: Record<string, unknown>;
    };

    if (rewards.gold && rewards.gold > 0) {
      await tx.insert(goldTransactions).values({
        id: newId("gold"),
        userId,
        characterId,
        sourceType: "boss_phase",
        sourceId: phase.id,
        amount: rewards.gold,
        idempotencyKey: `${idempotencyKey}:phase:${phase.id}:gold`,
        memo: `Phase reward: ${phase.name}`,
      });
    }

    if (rewards.item) {
      await tx.insert(inventoryItems).values({
        id: newId("item"),
        userId,
        characterId,
        name: String(rewards.item.name ?? phase.name),
        description: String(rewards.item.description ?? ""),
        rarity: String(rewards.item.rarity ?? "uncommon"),
        category: String(rewards.item.category ?? "trophy"),
        quantity: Number(rewards.item.quantity ?? 1),
        bonusesJson: {},
      });
    }
  }

  if (damageResult.defeated) {
    await tx.insert(goldTransactions).values({
      id: newId("gold"),
      userId,
      characterId,
      sourceType: "boss",
      sourceId: boss.id,
      amount: 50,
      idempotencyKey: `${idempotencyKey}:boss-defeat`,
      memo: `Defeated ${boss.title}`,
    });
  }

  return damageResult;
}
