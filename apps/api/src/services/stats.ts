import { and, eq, sql } from "drizzle-orm";
import {
  campaigns,
  habitCompletions,
  quests,
  skills,
  xpTransactions,
  goldTransactions,
} from "@lifequest/db";
import { getCharacterLevelProgress } from "@lifequest/domain";
import { db } from "../db.js";
import { getActiveCharacter } from "./characters.js";
import { getOrCreateActiveRuleSet } from "./progression-settings.js";

export async function getStats(userId: string) {
  const character = await getActiveCharacter(userId);
  if (!character) {
    return {
      character: null,
      totals: {
        characterXp: 0,
        goldEarned: 0,
        questsCompleted: 0,
        habitCompletions: 0,
        campaigns: 0,
      },
      skills: [],
    };
  }

  const { config } = await getOrCreateActiveRuleSet(userId);
  const levelProgress = getCharacterLevelProgress(character.characterXp, config);

  const goldEarned = await db
    .select({
      value: sql<number>`coalesce(sum(case when ${goldTransactions.amount} > 0 then ${goldTransactions.amount} else 0 end),0)::int`,
    })
    .from(goldTransactions)
    .where(
      and(
        eq(goldTransactions.userId, userId),
        eq(goldTransactions.characterId, character.id),
      ),
    )
    .then((r) => Number(r[0]?.value ?? 0));

  const questsCompleted = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(quests)
    .where(and(eq(quests.userId, userId), eq(quests.status, "completed")))
    .then((r) => Number(r[0]?.value ?? 0));

  const habitCount = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(habitCompletions)
    .where(eq(habitCompletions.userId, userId))
    .then((r) => Number(r[0]?.value ?? 0));

  const campaignCount = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(campaigns)
    .where(eq(campaigns.userId, userId))
    .then((r) => Number(r[0]?.value ?? 0));

  const skillRows = await db.query.skills.findMany({
    where: and(
      eq(skills.userId, userId),
      eq(skills.characterId, character.id),
    ),
  });

  const dayExpr = sql<string>`to_char(${xpTransactions.createdAt} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`;
  const xpHistory = await db
    .select({
      day: dayExpr,
      amount: sql<number>`coalesce(sum(${xpTransactions.amount}),0)::int`,
    })
    .from(xpTransactions)
    .where(
      and(
        eq(xpTransactions.userId, userId),
        eq(xpTransactions.characterId, character.id),
        eq(xpTransactions.xpKind, "character"),
      ),
    )
    .groupBy(dayExpr)
    .orderBy(dayExpr);

  return {
    character: { ...character, levelProgress },
    totals: {
      characterXp: character.characterXp,
      goldEarned,
      questsCompleted,
      habitCompletions: habitCount,
      campaigns: campaignCount,
    },
    skills: skillRows.map((s) => ({
      id: s.id,
      name: s.name,
      rank: s.rank,
      skillXp: s.skillXp,
    })),
    xpHistory,
  };
}
