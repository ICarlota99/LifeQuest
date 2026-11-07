import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { user } from "@lifequest/db";
import { db } from "../db.js";
import { handleError } from "../lib/errors.js";
import {
  requireAuth,
  type AuthedVariables,
} from "../middleware/auth.js";

const meRoutes = new Hono<{ Variables: AuthedVariables }>();

meRoutes.use("*", requireAuth);

meRoutes.get("/", (c) => {
  return c.json({ user: c.get("user") });
});

meRoutes.patch("/", async (c) => {
  try {
    const body = z
      .object({
        name: z.string().min(1).max(100).optional(),
        timezone: z.string().min(1).max(64).optional(),
      })
      .parse(await c.req.json());

    const [updated] = await db
      .update(user)
      .set({
        ...(body.name ? { name: body.name } : {}),
        ...(body.timezone ? { timezone: body.timezone } : {}),
        updatedAt: new Date(),
      })
      .where(eq(user.id, c.get("userId")))
      .returning();

    return c.json({ user: updated });
  } catch (err) {
    return handleError(c, err);
  }
});

export { meRoutes };
