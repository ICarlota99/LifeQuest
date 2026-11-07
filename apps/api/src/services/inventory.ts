import { and, desc, eq, sql } from "drizzle-orm";
import {
  goldTransactions,
  inventoryItems,
  newId,
  xpTransactions,
} from "@lifequest/db";
import { db } from "../db.js";
import { HttpError } from "../lib/errors.js";
import { getActiveCharacter } from "./characters.js";

export async function listInventory(userId: string) {
  const character = await getActiveCharacter(userId);
  if (!character) return { items: [], goldBalance: 0 };

  const items = await db.query.inventoryItems.findMany({
    where: and(
      eq(inventoryItems.userId, userId),
      eq(inventoryItems.characterId, character.id),
    ),
    orderBy: [desc(inventoryItems.acquiredAt)],
  });

  const goldBalance = await db
    .select({
      value: sql<number>`coalesce(sum(${goldTransactions.amount}),0)::int`,
    })
    .from(goldTransactions)
    .where(
      and(
        eq(goldTransactions.userId, userId),
        eq(goldTransactions.characterId, character.id),
      ),
    )
    .then((r) => Number(r[0]?.value ?? 0));

  return { items, goldBalance };
}

export async function createInventoryItem(
  userId: string,
  input: {
    name: string;
    description?: string;
    rarity?: string;
    category?: string;
    quantity?: number;
    bonusesJson?: Record<string, unknown>;
  },
) {
  const character = await getActiveCharacter(userId);
  if (!character) throw new HttpError(400, "Create a character first");

  const [row] = await db
    .insert(inventoryItems)
    .values({
      id: newId("item"),
      userId,
      characterId: character.id,
      name: input.name,
      description: input.description ?? "",
      rarity: input.rarity ?? "common",
      category: input.category ?? "collectible",
      quantity: input.quantity ?? 1,
      bonusesJson: input.bonusesJson ?? {},
    })
    .returning();
  return row!;
}

export async function updateInventoryItem(
  userId: string,
  itemId: string,
  input: Partial<{
    name: string;
    description: string;
    rarity: string;
    category: string;
    quantity: number;
    bonusesJson: Record<string, unknown>;
  }>,
) {
  const existing = await db.query.inventoryItems.findFirst({
    where: and(
      eq(inventoryItems.id, itemId),
      eq(inventoryItems.userId, userId),
    ),
  });
  if (!existing) throw new HttpError(404, "Item not found");

  const [row] = await db
    .update(inventoryItems)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(inventoryItems.id, itemId))
    .returning();
  return row!;
}

export async function deleteInventoryItem(userId: string, itemId: string) {
  const existing = await db.query.inventoryItems.findFirst({
    where: and(
      eq(inventoryItems.id, itemId),
      eq(inventoryItems.userId, userId),
    ),
  });
  if (!existing) throw new HttpError(404, "Item not found");
  await db.delete(inventoryItems).where(eq(inventoryItems.id, itemId));
}

export async function listGoldLedger(userId: string) {
  const character = await getActiveCharacter(userId);
  if (!character) return [];
  return db.query.goldTransactions.findMany({
    where: and(
      eq(goldTransactions.userId, userId),
      eq(goldTransactions.characterId, character.id),
    ),
    orderBy: [desc(goldTransactions.createdAt)],
    limit: 100,
  });
}

export async function listXpLedger(userId: string) {
  const character = await getActiveCharacter(userId);
  if (!character) return [];
  return db.query.xpTransactions.findMany({
    where: and(
      eq(xpTransactions.userId, userId),
      eq(xpTransactions.characterId, character.id),
    ),
    orderBy: [desc(xpTransactions.createdAt)],
    limit: 100,
  });
}
