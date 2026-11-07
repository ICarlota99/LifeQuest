import { Hono } from "hono";
import { z } from "zod";
import { handleError } from "../lib/errors.js";
import {
  requireAuth,
  type AuthedVariables,
} from "../middleware/auth.js";
import { completeActivity } from "../services/completions.js";

const completionsRoutes = new Hono<{ Variables: AuthedVariables }>();
completionsRoutes.use("*", requireAuth);

completionsRoutes.post("/", async (c) => {
  try {
    const body = z
      .object({
        sourceType: z.enum(["habit", "quest"]),
        sourceId: z.string(),
        idempotencyKey: z.string().min(8).max(128),
        effortHours: z.number().positive().max(4).optional(),
        quality: z.number().min(0.8).max(1.2).optional(),
        note: z.string().max(2000).optional(),
      })
      .parse(await c.req.json());

    const user = c.get("user");
    const result = await completeActivity(
      c.get("userId"),
      user.timezone ?? "UTC",
      body,
    );
    return c.json(result, result.duplicate ? 200 : 201);
  } catch (err) {
    return handleError(c, err);
  }
});

export { completionsRoutes };
