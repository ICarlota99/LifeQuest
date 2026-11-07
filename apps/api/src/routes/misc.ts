import { Hono } from "hono";
import { z } from "zod";
import type { ProgressionPreset } from "@lifequest/domain";
import { handleError } from "../lib/errors.js";
import {
  requireAuth,
  type AuthedVariables,
} from "../middleware/auth.js";
import * as inventoryService from "../services/inventory.js";
import * as journalService from "../services/journal.js";
import * as milestoneService from "../services/milestones.js";
import {
  getOrCreateActiveRuleSet,
  updateProgressionSettings,
} from "../services/progression-settings.js";
import { getStats } from "../services/stats.js";

const miscRoutes = new Hono<{ Variables: AuthedVariables }>();
miscRoutes.use("*", requireAuth);

miscRoutes.get("/inventory", async (c) => {
  try {
    return c.json(await inventoryService.listInventory(c.get("userId")));
  } catch (err) {
    return handleError(c, err);
  }
});

miscRoutes.post("/inventory", async (c) => {
  try {
    const body = z
      .object({
        name: z.string().min(1),
        description: z.string().optional(),
        rarity: z.string().optional(),
        category: z.string().optional(),
        quantity: z.number().int().positive().optional(),
        bonusesJson: z.record(z.unknown()).optional(),
      })
      .parse(await c.req.json());
    const item = await inventoryService.createInventoryItem(
      c.get("userId"),
      body,
    );
    return c.json({ item }, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

miscRoutes.patch("/inventory/:id", async (c) => {
  try {
    const body = z
      .object({
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        rarity: z.string().optional(),
        category: z.string().optional(),
        quantity: z.number().int().positive().optional(),
        bonusesJson: z.record(z.unknown()).optional(),
      })
      .parse(await c.req.json());
    const item = await inventoryService.updateInventoryItem(
      c.get("userId"),
      c.req.param("id"),
      body,
    );
    return c.json({ item });
  } catch (err) {
    return handleError(c, err);
  }
});

miscRoutes.delete("/inventory/:id", async (c) => {
  try {
    await inventoryService.deleteInventoryItem(
      c.get("userId"),
      c.req.param("id"),
    );
    return c.json({ ok: true });
  } catch (err) {
    return handleError(c, err);
  }
});

miscRoutes.get("/ledger/gold", async (c) => {
  try {
    return c.json({
      transactions: await inventoryService.listGoldLedger(c.get("userId")),
    });
  } catch (err) {
    return handleError(c, err);
  }
});

miscRoutes.get("/ledger/xp", async (c) => {
  try {
    return c.json({
      transactions: await inventoryService.listXpLedger(c.get("userId")),
    });
  } catch (err) {
    return handleError(c, err);
  }
});

miscRoutes.get("/journal", async (c) => {
  try {
    return c.json({
      entries: await journalService.listJournal(c.get("userId")),
    });
  } catch (err) {
    return handleError(c, err);
  }
});

miscRoutes.post("/journal", async (c) => {
  try {
    const body = z
      .object({
        title: z.string().optional(),
        body: z.string().min(1),
        tags: z.array(z.string()).optional(),
        linksJson: z.record(z.string().nullable()).optional(),
        entryDate: z.string().optional(),
      })
      .parse(await c.req.json());
    const entry = await journalService.createJournalEntry(
      c.get("userId"),
      body,
    );
    return c.json({ entry }, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

miscRoutes.patch("/journal/:id", async (c) => {
  try {
    const body = z
      .object({
        title: z.string().optional(),
        body: z.string().min(1).optional(),
        tags: z.array(z.string()).optional(),
        linksJson: z.record(z.string().nullable()).optional(),
      })
      .parse(await c.req.json());
    const entry = await journalService.updateJournalEntry(
      c.get("userId"),
      c.req.param("id"),
      body,
    );
    return c.json({ entry });
  } catch (err) {
    return handleError(c, err);
  }
});

miscRoutes.delete("/journal/:id", async (c) => {
  try {
    await journalService.deleteJournalEntry(
      c.get("userId"),
      c.req.param("id"),
    );
    return c.json({ ok: true });
  } catch (err) {
    return handleError(c, err);
  }
});

miscRoutes.get("/achievements", async (c) => {
  try {
    return c.json({
      achievements: await journalService.listAchievements(c.get("userId")),
    });
  } catch (err) {
    return handleError(c, err);
  }
});

miscRoutes.post("/achievements", async (c) => {
  try {
    const body = z
      .object({
        title: z.string().min(1),
        description: z.string().optional(),
        key: z.string().optional(),
        unlockConditions: z.record(z.unknown()).optional(),
      })
      .parse(await c.req.json());
    const achievement = await journalService.createCustomAchievement(
      c.get("userId"),
      body,
    );
    return c.json({ achievement }, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

miscRoutes.post("/achievements/:id/unlock", async (c) => {
  try {
    const unlock = await journalService.unlockAchievement(
      c.get("userId"),
      c.req.param("id"),
    );
    return c.json({ unlock });
  } catch (err) {
    return handleError(c, err);
  }
});

miscRoutes.get("/milestones", async (c) => {
  try {
    const subjectType = c.req.query("subjectType");
    const subjectId = c.req.query("subjectId");
    return c.json({
      milestones: await milestoneService.listMilestones(
        c.get("userId"),
        subjectType,
        subjectId,
      ),
    });
  } catch (err) {
    return handleError(c, err);
  }
});

miscRoutes.post("/milestones", async (c) => {
  try {
    const body = z
      .object({
        subjectType: z.string(),
        subjectId: z.string(),
        title: z.string().min(1),
        description: z.string().optional(),
        milestoneType: z.string().optional(),
        required: z.number().int().positive().optional(),
      })
      .parse(await c.req.json());
    const milestone = await milestoneService.createMilestone(
      c.get("userId"),
      body,
    );
    return c.json({ milestone }, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

miscRoutes.post("/milestones/:id/complete", async (c) => {
  try {
    const milestone = await milestoneService.completeMilestone(
      c.get("userId"),
      c.req.param("id"),
    );
    return c.json({ milestone });
  } catch (err) {
    return handleError(c, err);
  }
});

miscRoutes.delete("/milestones/:id", async (c) => {
  try {
    await milestoneService.deleteMilestone(c.get("userId"), c.req.param("id"));
    return c.json({ ok: true });
  } catch (err) {
    return handleError(c, err);
  }
});

miscRoutes.get("/progression-settings", async (c) => {
  try {
    const { row, config } = await getOrCreateActiveRuleSet(c.get("userId"));
    return c.json({ settings: row, config });
  } catch (err) {
    return handleError(c, err);
  }
});

miscRoutes.put("/progression-settings", async (c) => {
  try {
    const body = z
      .object({
        preset: z.enum(["casual", "balanced", "hardcore"]),
        overrides: z.record(z.unknown()).optional(),
      })
      .parse(await c.req.json());
    const result = await updateProgressionSettings(c.get("userId"), {
      preset: body.preset as ProgressionPreset,
      overrides: body.overrides as never,
    });
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

miscRoutes.get("/stats", async (c) => {
  try {
    return c.json(await getStats(c.get("userId")));
  } catch (err) {
    return handleError(c, err);
  }
});

export { miscRoutes };
