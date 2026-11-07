import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth.js";
import { characters } from "./characters.js";

export const journalEntries = pgTable("journal_entries", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  characterId: text("character_id").references(() => characters.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull().default(""),
  body: text("body").notNull(),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  linksJson: jsonb("links_json")
    .$type<Record<string, string | null>>()
    .notNull()
    .default({}),
  entryDate: timestamp("entry_date", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const achievements = pgTable("achievements", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  isSystem: integer("is_system").notNull().default(0),
  unlockConditions: jsonb("unlock_conditions")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const achievementUnlocks = pgTable("achievement_unlocks", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  achievementId: text("achievement_id")
    .notNull()
    .references(() => achievements.id, { onDelete: "cascade" }),
  characterId: text("character_id").references(() => characters.id, {
    onDelete: "set null",
  }),
  unlockedAt: timestamp("unlocked_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  metaJson: jsonb("meta_json")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
});
