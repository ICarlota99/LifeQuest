import "dotenv/config";
import { resolve } from "node:path";
import { config } from "dotenv";

// Load monorepo root .env when running from apps/api
config({ path: resolve(process.cwd(), "../../.env") });
config({ path: resolve(process.cwd(), ".env") });

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.API_PORT ?? 3001),
  host: process.env.API_HOST ?? "0.0.0.0",
  databaseUrl: required(
    "DATABASE_URL",
    "postgresql://lifequest:lifequest@localhost:5433/lifequest",
  ),
  betterAuthSecret: required(
    "BETTER_AUTH_SECRET",
    "dev-only-secret-change-me-32chars!!",
  ),
  betterAuthUrl: required("BETTER_AUTH_URL", "http://localhost:3001"),
  webOrigin: required("WEB_ORIGIN", "http://localhost:5173"),
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
};
