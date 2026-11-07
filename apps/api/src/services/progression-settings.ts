import { and, eq } from "drizzle-orm";
import { newId, progressionRuleSets } from "@lifequest/db";
import {
  getPreset,
  mergeConfigOverrides,
  type ProgressionConfig,
  type ProgressionPreset,
} from "@lifequest/domain";
import { db } from "../db.js";
import { HttpError } from "../lib/errors.js";

export async function getOrCreateActiveRuleSet(userId: string) {
  const existing = await db.query.progressionRuleSets.findFirst({
    where: and(
      eq(progressionRuleSets.userId, userId),
      eq(progressionRuleSets.isActive, 1),
    ),
  });
  if (existing) {
    const config = existing.configJson as unknown as ProgressionConfig;
    return { row: existing, config };
  }

  const preset: ProgressionPreset = "balanced";
  const config = getPreset(preset);
  const id = newId("rules");
  const [row] = await db
    .insert(progressionRuleSets)
    .values({
      id,
      userId,
      preset,
      version: config.version,
      configJson: config as unknown as Record<string, unknown>,
      isActive: 1,
    })
    .returning();

  return { row: row!, config };
}

export async function updateProgressionSettings(
  userId: string,
  input: {
    preset: ProgressionPreset;
    overrides?: Partial<ProgressionConfig>;
  },
) {
  const config = mergeConfigOverrides(input.preset, input.overrides);
  await db
    .update(progressionRuleSets)
    .set({ isActive: 0, updatedAt: new Date() })
    .where(
      and(
        eq(progressionRuleSets.userId, userId),
        eq(progressionRuleSets.isActive, 1),
      ),
    );

  const id = newId("rules");
  const [row] = await db
    .insert(progressionRuleSets)
    .values({
      id,
      userId,
      preset: input.preset,
      version: config.version,
      configJson: config as unknown as Record<string, unknown>,
      isActive: 1,
    })
    .returning();

  if (!row) throw new HttpError(500, "Failed to save progression settings");
  return { row, config };
}
