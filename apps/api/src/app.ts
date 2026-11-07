import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { auth } from "./auth.js";
import { env } from "./env.js";
import { HttpError, handleError } from "./lib/errors.js";
import { campaignsRoutes } from "./routes/campaigns.js";
import { charactersRoutes } from "./routes/characters.js";
import { completionsRoutes } from "./routes/completions.js";
import { meRoutes } from "./routes/me.js";
import { miscRoutes } from "./routes/misc.js";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: env.webOrigin,
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization", "Idempotency-Key"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

app.onError((err, c) => {
  if (err instanceof HttpError) {
    return c.json({ error: err.message }, err.status as 400);
  }
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  return handleError(c, err);
});

app.get("/health", (c) => c.json({ ok: true, service: "lifequest-api" }));

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.route("/api/me", meRoutes);
app.route("/api/characters", charactersRoutes);
app.route("/api/campaigns", campaignsRoutes);
app.route("/api/completions", completionsRoutes);
app.route("/api", miscRoutes);

export { app };
