import { Hono } from "hono";
import { z } from "zod";
import { handleError } from "../lib/errors.js";
import {
  requireAuth,
  type AuthedVariables,
} from "../middleware/auth.js";
import * as campaignService from "../services/campaigns.js";

const campaignsRoutes = new Hono<{ Variables: AuthedVariables }>();
campaignsRoutes.use("*", requireAuth);

const skillLinkSchema = z.object({
  skillId: z.string(),
  weight: z.number().int().positive().optional(),
});

campaignsRoutes.get("/", async (c) => {
  try {
    const items = await campaignService.listCampaigns(c.get("userId"));
    return c.json({ campaigns: items });
  } catch (err) {
    return handleError(c, err);
  }
});

campaignsRoutes.get("/:id", async (c) => {
  try {
    const detail = await campaignService.getCampaign(
      c.get("userId"),
      c.req.param("id"),
    );
    return c.json(detail);
  } catch (err) {
    return handleError(c, err);
  }
});

campaignsRoutes.post("/", async (c) => {
  try {
    const body = z
      .object({
        title: z.string().min(1).max(120),
        description: z.string().max(5000).optional(),
        narrative: z.string().max(10000).optional(),
        mainObjective: z.string().max(2000).optional(),
        difficulty: z.number().int().min(1).max(5).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        characterId: z.string().optional(),
      })
      .parse(await c.req.json());
    const campaign = await campaignService.createCampaign(
      c.get("userId"),
      body,
    );
    return c.json({ campaign }, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

campaignsRoutes.patch("/:id", async (c) => {
  try {
    const body = z
      .object({
        title: z.string().min(1).max(120).optional(),
        description: z.string().max(5000).optional(),
        narrative: z.string().max(10000).optional(),
        mainObjective: z.string().max(2000).optional(),
        difficulty: z.number().int().min(1).max(5).optional(),
        status: z.string().optional(),
        startDate: z.string().nullable().optional(),
        endDate: z.string().nullable().optional(),
      })
      .parse(await c.req.json());
    const campaign = await campaignService.updateCampaign(
      c.get("userId"),
      c.req.param("id"),
      body,
    );
    return c.json({ campaign });
  } catch (err) {
    return handleError(c, err);
  }
});

campaignsRoutes.post("/:id/quests", async (c) => {
  try {
    const body = z
      .object({
        title: z.string().min(1).max(120),
        description: z.string().max(5000).optional(),
        narrative: z.string().max(10000).optional(),
        questType: z
          .enum(["main", "side", "daily", "weekly"])
          .optional(),
        difficulty: z.number().int().min(1).max(5).optional(),
        estimatedEffortHours: z.number().positive().max(4).optional(),
        goldReward: z.number().int().optional(),
        bossId: z.string().optional(),
        skillLinks: z.array(skillLinkSchema).optional(),
      })
      .parse(await c.req.json());
    const quest = await campaignService.createQuest(c.get("userId"), {
      ...body,
      campaignId: c.req.param("id"),
    });
    return c.json({ quest }, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

campaignsRoutes.post("/:id/habits", async (c) => {
  try {
    const body = z
      .object({
        title: z.string().min(1).max(120),
        description: z.string().max(5000).optional(),
        difficulty: z.number().int().min(1).max(5).optional(),
        estimatedEffortHours: z.number().positive().max(4).optional(),
        frequency: z.string().optional(),
        bossId: z.string().optional(),
        skillLinks: z.array(skillLinkSchema).optional(),
      })
      .parse(await c.req.json());
    const habit = await campaignService.createHabit(c.get("userId"), {
      ...body,
      campaignId: c.req.param("id"),
    });
    return c.json({ habit }, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

campaignsRoutes.post("/:id/bosses", async (c) => {
  try {
    const body = z
      .object({
        title: z.string().min(1).max(120),
        description: z.string().max(5000).optional(),
        kind: z.enum(["intermediate", "final"]).optional(),
        maxHp: z.number().int().positive().optional(),
        phases: z
          .array(
            z.object({
              name: z.string(),
              hpThreshold: z.number().int().min(0),
              rewardsJson: z.record(z.unknown()).optional(),
            }),
          )
          .optional(),
      })
      .parse(await c.req.json());
    const boss = await campaignService.createBoss(c.get("userId"), {
      ...body,
      campaignId: c.req.param("id"),
    });
    return c.json({ boss }, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

export { campaignsRoutes };
