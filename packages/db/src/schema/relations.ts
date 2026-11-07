import { relations } from "drizzle-orm";
import { account, session, user } from "./auth.js";
import { attributes, characters, skills } from "./characters.js";
import {
  bossPhases,
  bosses,
  campaigns,
  habitCompletions,
  habitSkillLinks,
  habits,
  questSkillLinks,
  quests,
} from "./campaigns.js";
import {
  completions,
  goldTransactions,
  milestones,
  progressionRuleSets,
  xpTransactions,
} from "./progression.js";
import { inventoryItems } from "./inventory.js";
import {
  achievementUnlocks,
  achievements,
  journalEntries,
} from "./journal.js";

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  characters: many(characters),
  campaigns: many(campaigns),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const charactersRelations = relations(characters, ({ one, many }) => ({
  user: one(user, { fields: [characters.userId], references: [user.id] }),
  attributes: many(attributes),
  skills: many(skills),
}));

export const attributesRelations = relations(attributes, ({ one, many }) => ({
  character: one(characters, {
    fields: [attributes.characterId],
    references: [characters.id],
  }),
  skills: many(skills),
}));

export const skillsRelations = relations(skills, ({ one }) => ({
  attribute: one(attributes, {
    fields: [skills.attributeId],
    references: [attributes.id],
  }),
  character: one(characters, {
    fields: [skills.characterId],
    references: [characters.id],
  }),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  character: one(characters, {
    fields: [campaigns.characterId],
    references: [characters.id],
  }),
  quests: many(quests),
  habits: many(habits),
  bosses: many(bosses),
}));

export const questsRelations = relations(quests, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [quests.campaignId],
    references: [campaigns.id],
  }),
  skillLinks: many(questSkillLinks),
}));

export const questSkillLinksRelations = relations(questSkillLinks, ({ one }) => ({
  quest: one(quests, {
    fields: [questSkillLinks.questId],
    references: [quests.id],
  }),
  skill: one(skills, {
    fields: [questSkillLinks.skillId],
    references: [skills.id],
  }),
}));

export const habitsRelations = relations(habits, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [habits.campaignId],
    references: [campaigns.id],
  }),
  skillLinks: many(habitSkillLinks),
  completions: many(habitCompletions),
}));

export const habitSkillLinksRelations = relations(habitSkillLinks, ({ one }) => ({
  habit: one(habits, {
    fields: [habitSkillLinks.habitId],
    references: [habits.id],
  }),
  skill: one(skills, {
    fields: [habitSkillLinks.skillId],
    references: [skills.id],
  }),
}));

export const habitCompletionsRelations = relations(
  habitCompletions,
  ({ one }) => ({
    habit: one(habits, {
      fields: [habitCompletions.habitId],
      references: [habits.id],
    }),
  }),
);

export const bossesRelations = relations(bosses, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [bosses.campaignId],
    references: [campaigns.id],
  }),
  phases: many(bossPhases),
}));

export const bossPhasesRelations = relations(bossPhases, ({ one }) => ({
  boss: one(bosses, {
    fields: [bossPhases.bossId],
    references: [bosses.id],
  }),
}));

export const progressionRuleSetsRelations = relations(
  progressionRuleSets,
  ({ one }) => ({
    user: one(user, {
      fields: [progressionRuleSets.userId],
      references: [user.id],
    }),
  }),
);

export const completionsRelations = relations(completions, ({ one }) => ({
  character: one(characters, {
    fields: [completions.characterId],
    references: [characters.id],
  }),
}));

export const xpTransactionsRelations = relations(xpTransactions, ({ one }) => ({
  character: one(characters, {
    fields: [xpTransactions.characterId],
    references: [characters.id],
  }),
  skill: one(skills, {
    fields: [xpTransactions.skillId],
    references: [skills.id],
  }),
}));

export const goldTransactionsRelations = relations(
  goldTransactions,
  ({ one }) => ({
    character: one(characters, {
      fields: [goldTransactions.characterId],
      references: [characters.id],
    }),
  }),
);

export const milestonesRelations = relations(milestones, ({ one }) => ({
  user: one(user, { fields: [milestones.userId], references: [user.id] }),
}));

export const inventoryItemsRelations = relations(inventoryItems, ({ one }) => ({
  character: one(characters, {
    fields: [inventoryItems.characterId],
    references: [characters.id],
  }),
}));

export const journalEntriesRelations = relations(journalEntries, ({ one }) => ({
  user: one(user, { fields: [journalEntries.userId], references: [user.id] }),
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  unlocks: many(achievementUnlocks),
}));

export const achievementUnlocksRelations = relations(
  achievementUnlocks,
  ({ one }) => ({
    achievement: one(achievements, {
      fields: [achievementUnlocks.achievementId],
      references: [achievements.id],
    }),
  }),
);
