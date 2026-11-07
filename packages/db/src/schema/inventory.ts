import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth.js";
import { characters } from "./characters.js";

export const inventoryItems = pgTable("inventory_items", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  characterId: text("character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  rarity: text("rarity").notNull().default("common"),
  category: text("category").notNull().default("collectible"),
  quantity: integer("quantity").notNull().default(1),
  bonusesJson: jsonb("bonuses_json")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  sourceQuestId: text("source_quest_id"),
  sourceAchievementId: text("source_achievement_id"),
  acquiredAt: timestamp("acquired_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
