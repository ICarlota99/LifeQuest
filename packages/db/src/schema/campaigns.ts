import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  date,
} from "drizzle-orm/pg-core";
import { user } from "./auth.js";
import { characters, skills } from "./characters.js";

export const campaigns = pgTable("campaigns", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  characterId: text("character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  narrative: text("narrative").notNull().default(""),
  mainObjective: text("main_objective").notNull().default(""),
  difficulty: integer("difficulty").notNull().default(3),
  status: text("status").notNull().default("active"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  completionConditions: jsonb("completion_conditions")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const quests = pgTable("quests", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  campaignId: text("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  narrative: text("narrative").notNull().default(""),
  questType: text("quest_type").notNull().default("main"),
  difficulty: integer("difficulty").notNull().default(3),
  estimatedEffortHours: integer("estimated_effort_hours").notNull().default(1),
  deadline: timestamp("deadline", { withTimezone: true }),
  status: text("status").notNull().default("available"),
  progress: integer("progress").notNull().default(0),
  xpReward: integer("xp_reward"),
  goldReward: integer("gold_reward"),
  itemRewards: jsonb("item_rewards")
    .$type<Record<string, unknown>[]>()
    .notNull()
    .default([]),
  prerequisites: jsonb("prerequisites")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  completionCriteria: jsonb("completion_criteria")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  bossId: text("boss_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const questSkillLinks = pgTable("quest_skill_links", {
  id: text("id").primaryKey(),
  questId: text("quest_id")
    .notNull()
    .references(() => quests.id, { onDelete: "cascade" }),
  skillId: text("skill_id")
    .notNull()
    .references(() => skills.id, { onDelete: "cascade" }),
  weight: integer("weight").notNull().default(100),
});

export const habits = pgTable("habits", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  campaignId: text("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  difficulty: integer("difficulty").notNull().default(2),
  estimatedEffortHours: integer("estimated_effort_hours").notNull().default(1),
  frequency: text("frequency").notNull().default("daily"),
  scheduleJson: jsonb("schedule_json")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  softStreak: integer("soft_streak").notNull().default(0),
  status: text("status").notNull().default("active"),
  xpReward: integer("xp_reward"),
  goldReward: integer("gold_reward"),
  bossId: text("boss_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const habitSkillLinks = pgTable("habit_skill_links", {
  id: text("id").primaryKey(),
  habitId: text("habit_id")
    .notNull()
    .references(() => habits.id, { onDelete: "cascade" }),
  skillId: text("skill_id")
    .notNull()
    .references(() => skills.id, { onDelete: "cascade" }),
  weight: integer("weight").notNull().default(100),
});

export const habitCompletions = pgTable(
  "habit_completions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    habitId: text("habit_id")
      .notNull()
      .references(() => habits.id, { onDelete: "cascade" }),
    occurredOn: text("occurred_on").notNull(),
    completionId: text("completion_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("habit_completions_once_per_day").on(t.habitId, t.occurredOn),
  ],
);

export const bosses = pgTable("bosses", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  campaignId: text("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  kind: text("kind").notNull().default("intermediate"),
  maxHp: integer("max_hp").notNull().default(100),
  currentHp: integer("current_hp").notNull().default(100),
  status: text("status").notNull().default("active"),
  habitChipDamageToday: integer("habit_chip_damage_today").notNull().default(0),
  habitChipDate: text("habit_chip_date"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const bossPhases = pgTable("boss_phases", {
  id: text("id").primaryKey(),
  bossId: text("boss_id")
    .notNull()
    .references(() => bosses.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  hpThreshold: integer("hp_threshold").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  conditionsJson: jsonb("conditions_json")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  rewardsJson: jsonb("rewards_json")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  rewardsGranted: integer("rewards_granted").notNull().default(0),
});
