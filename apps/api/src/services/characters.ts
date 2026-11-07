import { and, asc, count, eq } from "drizzle-orm";
import {
  attributes,
  characters,
  newId,
  skills,
} from "@lifequest/db";
import {
  DEFAULT_ATTRIBUTE_COLOR,
  DEFAULT_ATTRIBUTE_PRESET,
  assertAttributeCap,
  assertAttributeColorId,
  assertAttributeScore,
  assertOneActiveCharacter,
  assertSkillCap,
  defaultColorForAttributeKey,
  getCharacterLevelProgress,
  getSkillRankProgress,
} from "@lifequest/domain";
import { db } from "../db.js";
import { HttpError } from "../lib/errors.js";
import { getOrCreateActiveRuleSet } from "./progression-settings.js";

export async function getActiveCharacter(userId: string) {
  return db.query.characters.findFirst({
    where: and(eq(characters.userId, userId), eq(characters.isActive, true)),
    columns: { portraitWebp: false },
  });
}

function portraitMeta(character: {
  id: string;
  portraitUpdatedAt: Date | null;
}) {
  const hasPortrait = Boolean(character.portraitUpdatedAt);
  const bust = character.portraitUpdatedAt
    ? character.portraitUpdatedAt.getTime()
    : 0;
  return {
    hasPortrait,
    portraitUrl: hasPortrait
      ? `/api/characters/${character.id}/portrait?v=${bust}`
      : null as string | null,
  };
}

export async function getCharacterSheet(userId: string) {
  const character = await getActiveCharacter(userId);
  if (!character) return null;

  const attrs = await db.query.attributes.findMany({
    where: and(
      eq(attributes.userId, userId),
      eq(attributes.characterId, character.id),
    ),
    orderBy: [asc(attributes.sortOrder)],
  });

  const allSkills = await db.query.skills.findMany({
    where: and(
      eq(skills.userId, userId),
      eq(skills.characterId, character.id),
    ),
    orderBy: [asc(skills.sortOrder)],
  });

  const { config } = await getOrCreateActiveRuleSet(userId);
  const levelProgress = getCharacterLevelProgress(
    character.characterXp,
    config,
  );

  return {
    character: {
      ...character,
      ...portraitMeta(character),
      levelProgress,
    },
    attributes: attrs.map((attr) => ({
      ...attr,
      skills: allSkills
        .filter((s) => s.attributeId === attr.id)
        .map((s) => ({
          ...s,
          rankProgress: getSkillRankProgress(s.skillXp, s.rank, 0, config),
        })),
    })),
  };
}

export async function setPortrait(
  userId: string,
  characterId: string,
  webp: Buffer,
) {
  const existing = await db.query.characters.findFirst({
    where: and(eq(characters.id, characterId), eq(characters.userId, userId)),
    columns: { id: true },
  });
  if (!existing) throw new HttpError(404, "Character not found");

  const now = new Date();
  const [updated] = await db
    .update(characters)
    .set({
      portraitWebp: webp,
      portraitUpdatedAt: now,
      updatedAt: now,
    })
    .where(eq(characters.id, characterId))
    .returning({
      id: characters.id,
      portraitUpdatedAt: characters.portraitUpdatedAt,
    });

  return {
    ...updated!,
    ...portraitMeta({
      id: characterId,
      portraitUpdatedAt: updated!.portraitUpdatedAt,
    }),
  };
}

export async function getPortrait(userId: string, characterId: string) {
  const row = await db.query.characters.findFirst({
    where: and(eq(characters.id, characterId), eq(characters.userId, userId)),
    columns: {
      portraitWebp: true,
      portraitUpdatedAt: true,
    },
  });
  if (!row) throw new HttpError(404, "Character not found");
  if (!row.portraitWebp || !row.portraitUpdatedAt) {
    throw new HttpError(404, "Portrait not found");
  }
  return {
    webp: row.portraitWebp,
    updatedAt: row.portraitUpdatedAt,
  };
}

export async function clearPortrait(userId: string, characterId: string) {
  const existing = await db.query.characters.findFirst({
    where: and(eq(characters.id, characterId), eq(characters.userId, userId)),
    columns: { id: true },
  });
  if (!existing) throw new HttpError(404, "Character not found");

  await db
    .update(characters)
    .set({
      portraitWebp: null,
      portraitUpdatedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(characters.id, characterId));
}

export async function createCharacter(
  userId: string,
  input: {
    name: string;
    className?: string;
    race?: string;
    background?: string;
    biography?: string;
    appearance?: Record<string, unknown>;
  },
) {
  const [{ value: activeCount }] = await db
    .select({ value: count() })
    .from(characters)
    .where(and(eq(characters.userId, userId), eq(characters.isActive, true)));

  assertOneActiveCharacter(Number(activeCount));

  await getOrCreateActiveRuleSet(userId);

  const characterId = newId("char");

  return db.transaction(async (tx) => {
    const [character] = await tx
      .insert(characters)
      .values({
        id: characterId,
        userId,
        name: input.name,
        className: input.className ?? "Adventurer",
        race: input.race ?? "Human",
        background: input.background ?? "",
        biography: input.biography ?? "",
        appearance: input.appearance ?? {},
        isActive: true,
      })
      .returning();

    for (const [i, preset] of DEFAULT_ATTRIBUTE_PRESET.entries()) {
      const attrId = newId("attr");
      await tx.insert(attributes).values({
        id: attrId,
        userId,
        characterId,
        key: preset.key,
        name: preset.name,
        description: preset.description,
        color: defaultColorForAttributeKey(preset.key),
        score: preset.score,
        minValue: preset.min,
        maxValue: preset.max,
        sortOrder: i,
      });

      for (const [j, skill] of preset.skills
        .slice(0, 6)
        .entries()) {
        await tx.insert(skills).values({
          id: newId("skill"),
          userId,
          attributeId: attrId,
          characterId,
          name: skill.name,
          description: skill.description,
          sortOrder: j,
        });
      }
    }

    return character!;
  });
}

export async function updateCharacter(
  userId: string,
  characterId: string,
  input: Partial<{
    name: string;
    className: string;
    race: string;
    background: string;
    biography: string;
    appearance: Record<string, unknown>;
  }>,
) {
  const existing = await db.query.characters.findFirst({
    where: and(eq(characters.id, characterId), eq(characters.userId, userId)),
  });
  if (!existing) throw new HttpError(404, "Character not found");

  const [updated] = await db
    .update(characters)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(characters.id, characterId))
    .returning({
      id: characters.id,
      userId: characters.userId,
      name: characters.name,
      className: characters.className,
      race: characters.race,
      background: characters.background,
      biography: characters.biography,
      appearance: characters.appearance,
      portraitUpdatedAt: characters.portraitUpdatedAt,
      level: characters.level,
      characterXp: characters.characterXp,
      isActive: characters.isActive,
      createdAt: characters.createdAt,
      updatedAt: characters.updatedAt,
    });
  return updated;
}

export async function createAttribute(
  userId: string,
  input: {
    characterId: string;
    key: string;
    name: string;
    description?: string;
    color?: string;
    score?: number;
    minValue?: number;
    maxValue?: number;
  },
) {
  const character = await db.query.characters.findFirst({
    where: and(
      eq(characters.id, input.characterId),
      eq(characters.userId, userId),
    ),
  });
  if (!character) throw new HttpError(404, "Character not found");

  const [{ value }] = await db
    .select({ value: count() })
    .from(attributes)
    .where(
      and(
        eq(attributes.characterId, input.characterId),
        eq(attributes.userId, userId),
      ),
    );
  assertAttributeCap(Number(value));

  const minValue = input.minValue ?? 1;
  const maxValue = input.maxValue ?? 20;
  const score = input.score ?? 10;
  assertAttributeScore(score, minValue, maxValue);
  const color = input.color
    ? assertAttributeColorId(input.color)
    : defaultColorForAttributeKey(input.key) || DEFAULT_ATTRIBUTE_COLOR;

  const [row] = await db
    .insert(attributes)
    .values({
      id: newId("attr"),
      userId,
      characterId: input.characterId,
      key: input.key,
      name: input.name,
      description: input.description ?? "",
      color,
      score,
      minValue,
      maxValue,
      sortOrder: Number(value),
    })
    .returning();
  return row!;
}

export async function updateAttribute(
  userId: string,
  attributeId: string,
  input: Partial<{
    key: string;
    name: string;
    description: string;
    color: string;
    score: number;
    minValue: number;
    maxValue: number;
  }>,
) {
  const existing = await db.query.attributes.findFirst({
    where: and(eq(attributes.id, attributeId), eq(attributes.userId, userId)),
  });
  if (!existing) throw new HttpError(404, "Attribute not found");

  const minValue = input.minValue ?? existing.minValue;
  const maxValue = input.maxValue ?? existing.maxValue;
  const score = input.score ?? existing.score;
  assertAttributeScore(score, minValue, maxValue);
  const color =
    input.color !== undefined
      ? assertAttributeColorId(input.color)
      : undefined;

  const [row] = await db
    .update(attributes)
    .set({
      ...input,
      ...(color !== undefined ? { color } : {}),
      updatedAt: new Date(),
    })
    .where(eq(attributes.id, attributeId))
    .returning();
  return row!;
}

export async function deleteAttribute(userId: string, attributeId: string) {
  const existing = await db.query.attributes.findFirst({
    where: and(eq(attributes.id, attributeId), eq(attributes.userId, userId)),
  });
  if (!existing) throw new HttpError(404, "Attribute not found");
  await db.delete(attributes).where(eq(attributes.id, attributeId));
}

export async function createSkill(
  userId: string,
  input: {
    attributeId: string;
    name: string;
    description?: string;
  },
) {
  const attr = await db.query.attributes.findFirst({
    where: and(
      eq(attributes.id, input.attributeId),
      eq(attributes.userId, userId),
    ),
  });
  if (!attr) throw new HttpError(404, "Attribute not found");

  const [{ value }] = await db
    .select({ value: count() })
    .from(skills)
    .where(
      and(
        eq(skills.attributeId, input.attributeId),
        eq(skills.userId, userId),
      ),
    );
  assertSkillCap(Number(value));

  const [row] = await db
    .insert(skills)
    .values({
      id: newId("skill"),
      userId,
      attributeId: input.attributeId,
      characterId: attr.characterId,
      name: input.name,
      description: input.description ?? "",
      sortOrder: Number(value),
    })
    .returning();
  return row!;
}

export async function updateSkill(
  userId: string,
  skillId: string,
  input: Partial<{ name: string; description: string; sortOrder: number }>,
) {
  const existing = await db.query.skills.findFirst({
    where: and(eq(skills.id, skillId), eq(skills.userId, userId)),
  });
  if (!existing) throw new HttpError(404, "Skill not found");

  const [row] = await db
    .update(skills)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(skills.id, skillId))
    .returning();
  return row!;
}

export async function deleteSkill(userId: string, skillId: string) {
  const existing = await db.query.skills.findFirst({
    where: and(eq(skills.id, skillId), eq(skills.userId, userId)),
  });
  if (!existing) throw new HttpError(404, "Skill not found");
  await db.delete(skills).where(eq(skills.id, skillId));
}
