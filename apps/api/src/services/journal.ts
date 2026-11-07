import { and, desc, eq } from "drizzle-orm";
import { achievementUnlocks, achievements, journalEntries, newId } from "@lifequest/db";
import { db } from "../db.js";
import { HttpError } from "../lib/errors.js";
import { getActiveCharacter } from "./characters.js";

export async function listJournal(userId: string) {
  return db.query.journalEntries.findMany({
    where: eq(journalEntries.userId, userId),
    orderBy: [desc(journalEntries.entryDate)],
  });
}

export async function createJournalEntry(
  userId: string,
  input: {
    title?: string;
    body: string;
    tags?: string[];
    linksJson?: Record<string, string | null>;
    entryDate?: string;
  },
) {
  const character = await getActiveCharacter(userId);
  const [row] = await db
    .insert(journalEntries)
    .values({
      id: newId("journal"),
      userId,
      characterId: character?.id,
      title: input.title ?? "",
      body: input.body,
      tags: input.tags ?? [],
      linksJson: input.linksJson ?? {},
      entryDate: input.entryDate ? new Date(input.entryDate) : new Date(),
    })
    .returning();
  return row!;
}

export async function updateJournalEntry(
  userId: string,
  entryId: string,
  input: Partial<{
    title: string;
    body: string;
    tags: string[];
    linksJson: Record<string, string | null>;
  }>,
) {
  const existing = await db.query.journalEntries.findFirst({
    where: and(
      eq(journalEntries.id, entryId),
      eq(journalEntries.userId, userId),
    ),
  });
  if (!existing) throw new HttpError(404, "Journal entry not found");

  const [row] = await db
    .update(journalEntries)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(journalEntries.id, entryId))
    .returning();
  return row!;
}

export async function deleteJournalEntry(userId: string, entryId: string) {
  const existing = await db.query.journalEntries.findFirst({
    where: and(
      eq(journalEntries.id, entryId),
      eq(journalEntries.userId, userId),
    ),
  });
  if (!existing) throw new HttpError(404, "Journal entry not found");
  await db.delete(journalEntries).where(eq(journalEntries.id, entryId));
}

const SYSTEM_ACHIEVEMENTS = [
  {
    key: "first_quest",
    title: "First Steps",
    description: "Complete your first quest.",
  },
  {
    key: "first_habit_streak_7",
    title: "Week of Resolve",
    description: "Reach a 7-day soft streak on any habit.",
  },
  {
    key: "first_boss",
    title: "Boss Slayer",
    description: "Defeat your first boss.",
  },
  {
    key: "level_5",
    title: "Seasoned Adventurer",
    description: "Reach character level 5.",
  },
];

export async function ensureSystemAchievements(userId: string) {
  const existing = await db.query.achievements.findMany({
    where: eq(achievements.userId, userId),
  });
  const keys = new Set(existing.map((a) => a.key));
  for (const def of SYSTEM_ACHIEVEMENTS) {
    if (keys.has(def.key)) continue;
    await db.insert(achievements).values({
      id: newId("ach"),
      userId,
      key: def.key,
      title: def.title,
      description: def.description,
      isSystem: 1,
      unlockConditions: { key: def.key },
    });
  }
}

export async function listAchievements(userId: string) {
  await ensureSystemAchievements(userId);
  const defs = await db.query.achievements.findMany({
    where: eq(achievements.userId, userId),
  });
  const unlocks = await db.query.achievementUnlocks.findMany({
    where: eq(achievementUnlocks.userId, userId),
  });
  const unlockedIds = new Set(unlocks.map((u) => u.achievementId));
  return defs.map((d) => ({
    ...d,
    unlocked: unlockedIds.has(d.id),
    unlockedAt: unlocks.find((u) => u.achievementId === d.id)?.unlockedAt ?? null,
  }));
}

export async function createCustomAchievement(
  userId: string,
  input: {
    title: string;
    description?: string;
    key?: string;
    unlockConditions?: Record<string, unknown>;
  },
) {
  const [row] = await db
    .insert(achievements)
    .values({
      id: newId("ach"),
      userId,
      key: input.key ?? `custom_${Date.now()}`,
      title: input.title,
      description: input.description ?? "",
      isSystem: 0,
      unlockConditions: input.unlockConditions ?? {},
    })
    .returning();
  return row!;
}

export async function unlockAchievement(
  userId: string,
  achievementId: string,
) {
  const def = await db.query.achievements.findFirst({
    where: and(
      eq(achievements.id, achievementId),
      eq(achievements.userId, userId),
    ),
  });
  if (!def) throw new HttpError(404, "Achievement not found");

  const already = await db.query.achievementUnlocks.findFirst({
    where: and(
      eq(achievementUnlocks.userId, userId),
      eq(achievementUnlocks.achievementId, achievementId),
    ),
  });
  if (already) return already;

  const character = await getActiveCharacter(userId);
  const [row] = await db
    .insert(achievementUnlocks)
    .values({
      id: newId("unlock"),
      userId,
      achievementId,
      characterId: character?.id,
    })
    .returning();
  return row!;
}
