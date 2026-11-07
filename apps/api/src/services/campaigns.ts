import { and, asc, eq } from "drizzle-orm";
import {
  bossPhases,
  bosses,
  campaigns,
  habitSkillLinks,
  habits,
  newId,
  questSkillLinks,
  quests,
} from "@lifequest/db";
import { db } from "../db.js";
import { HttpError } from "../lib/errors.js";
import { getActiveCharacter } from "./characters.js";

export async function listCampaigns(userId: string) {
  return db.query.campaigns.findMany({
    where: eq(campaigns.userId, userId),
    orderBy: [asc(campaigns.createdAt)],
  });
}

export async function getCampaign(userId: string, campaignId: string) {
  const campaign = await db.query.campaigns.findFirst({
    where: and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)),
  });
  if (!campaign) throw new HttpError(404, "Campaign not found");

  const campaignQuests = await db.query.quests.findMany({
    where: and(eq(quests.campaignId, campaignId), eq(quests.userId, userId)),
  });
  const campaignHabits = await db.query.habits.findMany({
    where: and(eq(habits.campaignId, campaignId), eq(habits.userId, userId)),
  });
  const campaignBosses = await db.query.bosses.findMany({
    where: and(eq(bosses.campaignId, campaignId), eq(bosses.userId, userId)),
  });

  const allPhases =
    campaignBosses.length === 0
      ? []
      : await Promise.all(
          campaignBosses.map((b) =>
            db.query.bossPhases.findMany({
              where: eq(bossPhases.bossId, b.id),
              orderBy: [asc(bossPhases.sortOrder)],
            }),
          ),
        );

  return {
    campaign,
    quests: campaignQuests,
    habits: campaignHabits,
    bosses: campaignBosses.map((b, i) => ({
      ...b,
      phases: allPhases[i] ?? [],
    })),
  };
}

export async function createCampaign(
  userId: string,
  input: {
    title: string;
    description?: string;
    narrative?: string;
    mainObjective?: string;
    difficulty?: number;
    startDate?: string;
    endDate?: string;
    characterId?: string;
  },
) {
  const active = await getActiveCharacter(userId);
  if (!active) throw new HttpError(400, "Create a character first");
  if (input.characterId && input.characterId !== active.id) {
    throw new HttpError(400, "MVP only supports the active character");
  }

  const [row] = await db
    .insert(campaigns)
    .values({
      id: newId("camp"),
      userId,
      characterId: active.id,
      title: input.title,
      description: input.description ?? "",
      narrative: input.narrative ?? "",
      mainObjective: input.mainObjective ?? "",
      difficulty: input.difficulty ?? 3,
      startDate: input.startDate,
      endDate: input.endDate,
      status: "active",
    })
    .returning();
  return row!;
}

export async function updateCampaign(
  userId: string,
  campaignId: string,
  input: Partial<{
    title: string;
    description: string;
    narrative: string;
    mainObjective: string;
    difficulty: number;
    status: string;
    startDate: string | null;
    endDate: string | null;
  }>,
) {
  const existing = await db.query.campaigns.findFirst({
    where: and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)),
  });
  if (!existing) throw new HttpError(404, "Campaign not found");

  const [row] = await db
    .update(campaigns)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(campaigns.id, campaignId))
    .returning();
  return row!;
}

export async function createQuest(
  userId: string,
  input: {
    campaignId: string;
    title: string;
    description?: string;
    narrative?: string;
    questType?: string;
    difficulty?: number;
    estimatedEffortHours?: number;
    goldReward?: number;
    bossId?: string;
    skillLinks?: Array<{ skillId: string; weight?: number }>;
  },
) {
  const campaign = await db.query.campaigns.findFirst({
    where: and(
      eq(campaigns.id, input.campaignId),
      eq(campaigns.userId, userId),
    ),
  });
  if (!campaign) throw new HttpError(404, "Campaign not found");

  const questId = newId("quest");
  const [quest] = await db
    .insert(quests)
    .values({
      id: questId,
      userId,
      campaignId: input.campaignId,
      title: input.title,
      description: input.description ?? "",
      narrative: input.narrative ?? "",
      questType: input.questType ?? "main",
      difficulty: input.difficulty ?? 3,
      estimatedEffortHours: input.estimatedEffortHours ?? 1,
      goldReward: input.goldReward,
      bossId: input.bossId,
      status: "available",
    })
    .returning();

  for (const link of input.skillLinks ?? []) {
    await db.insert(questSkillLinks).values({
      id: newId("qsl"),
      questId,
      skillId: link.skillId,
      weight: link.weight ?? 100,
    });
  }

  return quest!;
}

export async function createHabit(
  userId: string,
  input: {
    campaignId: string;
    title: string;
    description?: string;
    difficulty?: number;
    estimatedEffortHours?: number;
    frequency?: string;
    bossId?: string;
    skillLinks?: Array<{ skillId: string; weight?: number }>;
  },
) {
  const campaign = await db.query.campaigns.findFirst({
    where: and(
      eq(campaigns.id, input.campaignId),
      eq(campaigns.userId, userId),
    ),
  });
  if (!campaign) throw new HttpError(404, "Campaign not found");

  const habitId = newId("habit");
  const [habit] = await db
    .insert(habits)
    .values({
      id: habitId,
      userId,
      campaignId: input.campaignId,
      title: input.title,
      description: input.description ?? "",
      difficulty: input.difficulty ?? 2,
      estimatedEffortHours: input.estimatedEffortHours ?? 1,
      frequency: input.frequency ?? "daily",
      bossId: input.bossId,
      status: "active",
    })
    .returning();

  for (const link of input.skillLinks ?? []) {
    await db.insert(habitSkillLinks).values({
      id: newId("hsl"),
      habitId,
      skillId: link.skillId,
      weight: link.weight ?? 100,
    });
  }

  return habit!;
}

export async function createBoss(
  userId: string,
  input: {
    campaignId: string;
    title: string;
    description?: string;
    kind?: "intermediate" | "final";
    maxHp?: number;
    phases?: Array<{ name: string; hpThreshold: number; rewardsJson?: Record<string, unknown> }>;
  },
) {
  const campaign = await db.query.campaigns.findFirst({
    where: and(
      eq(campaigns.id, input.campaignId),
      eq(campaigns.userId, userId),
    ),
  });
  if (!campaign) throw new HttpError(404, "Campaign not found");

  const maxHp = input.maxHp ?? 100;
  const bossId = newId("boss");

  return db.transaction(async (tx) => {
    const [boss] = await tx
      .insert(bosses)
      .values({
        id: bossId,
        userId,
        campaignId: input.campaignId,
        title: input.title,
        description: input.description ?? "",
        kind: input.kind ?? "intermediate",
        maxHp,
        currentHp: maxHp,
        status: "active",
      })
      .returning();

    const phases =
      input.phases ??
      [
        { name: "Enraged", hpThreshold: Math.floor(maxHp * 0.5) },
        { name: "Final Stand", hpThreshold: 0 },
      ];

    for (const [i, phase] of phases.entries()) {
      await tx.insert(bossPhases).values({
        id: newId("phase"),
        bossId,
        name: phase.name,
        hpThreshold: phase.hpThreshold,
        sortOrder: i,
        rewardsJson: phase.rewardsJson ?? {},
      });
    }

    return boss!;
  });
}
