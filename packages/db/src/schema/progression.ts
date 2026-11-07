import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth.js";
import { characters, skills } from "./characters.js";

export const progressionRuleSets = pgTable("progression_rule_sets", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  preset: text("preset").notNull().default("balanced"),
  version: integer("version").notNull().default(1),
  configJson: jsonb("config_json")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const completions = pgTable(
  "completions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    characterId: text("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    sourceType: text("source_type").notNull(),
    sourceId: text("source_id").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    difficulty: integer("difficulty").notNull().default(1),
    effortHours: integer("effort_hours").notNull().default(1),
    note: text("note"),
    occurredOn: text("occurred_on").notNull(),
    metaJson: jsonb("meta_json")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("completions_idempotency").on(t.userId, t.idempotencyKey)],
);

export const xpTransactions = pgTable(
  "xp_transactions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    characterId: text("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    skillId: text("skill_id").references(() => skills.id, {
      onDelete: "set null",
    }),
    completionId: text("completion_id").references(() => completions.id, {
      onDelete: "set null",
    }),
    ruleSetId: text("rule_set_id").references(() => progressionRuleSets.id, {
      onDelete: "set null",
    }),
    sourceType: text("source_type").notNull(),
    sourceId: text("source_id"),
    amount: integer("amount").notNull(),
    xpKind: text("xp_kind").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    metaJson: jsonb("meta_json")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("xp_transactions_idempotency").on(t.userId, t.idempotencyKey),
  ],
);

export const goldTransactions = pgTable(
  "gold_transactions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    characterId: text("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    completionId: text("completion_id").references(() => completions.id, {
      onDelete: "set null",
    }),
    sourceType: text("source_type").notNull(),
    sourceId: text("source_id"),
    amount: integer("amount").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    memo: text("memo"),
    metaJson: jsonb("meta_json")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("gold_transactions_idempotency").on(t.userId, t.idempotencyKey),
  ],
);

export const milestones = pgTable("milestones", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  subjectType: text("subject_type").notNull(),
  subjectId: text("subject_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  milestoneType: text("milestone_type").notNull().default("boolean"),
  required: integer("required").notNull().default(1),
  progress: integer("progress").notNull().default(0),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
