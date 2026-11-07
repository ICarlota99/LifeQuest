import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth.js";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export const characters = pgTable(
  "characters",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    className: text("class_name").notNull().default("Adventurer"),
    race: text("race").notNull().default("Human"),
    background: text("background").notNull().default(""),
    biography: text("biography").notNull().default(""),
    appearance: jsonb("appearance")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    portraitWebp: bytea("portrait_webp"),
    portraitUpdatedAt: timestamp("portrait_updated_at", { withTimezone: true }),
    level: integer("level").notNull().default(1),
    characterXp: integer("character_xp").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("characters_one_active_per_user")
      .on(t.userId)
      .where(sql`${t.isActive} = true`),
  ],
);

export const attributes = pgTable("attributes", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  characterId: text("character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  score: integer("score").notNull().default(10),
  minValue: integer("min_value").notNull().default(1),
  maxValue: integer("max_value").notNull().default(20),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const skills = pgTable("skills", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  attributeId: text("attribute_id")
    .notNull()
    .references(() => attributes.id, { onDelete: "cascade" }),
  characterId: text("character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  rank: integer("rank").notNull().default(0),
  skillXp: integer("skill_xp").notNull().default(0),
  progressionOverrides: jsonb("progression_overrides")
    .$type<Record<string, unknown> | null>()
    .default(null),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
