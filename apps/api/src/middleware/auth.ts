import { createMiddleware } from "hono/factory";
import { auth } from "../auth.js";
import { HttpError } from "../lib/errors.js";

export type AuthedVariables = {
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    timezone?: string | null;
    image?: string | null;
  };
};

export const requireAuth = createMiddleware<{ Variables: AuthedVariables }>(
  async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      throw new HttpError(401, "Unauthorized");
    }
    c.set("userId", session.user.id);
    c.set("user", {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      timezone: (session.user as { timezone?: string }).timezone ?? "UTC",
      image: session.user.image,
    });
    await next();
  },
);
