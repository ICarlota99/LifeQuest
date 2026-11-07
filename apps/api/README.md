# LifeQuest API

Hono REST API with Better Auth, Drizzle, and the `@lifequest/domain` progression engine.

## Dev

```bash
pnpm --filter @lifequest/api dev
```

## Deploy (Fly.io)

```bash
fly launch --config apps/api/fly.toml
fly secrets set DATABASE_URL=... BETTER_AUTH_SECRET=... BETTER_AUTH_URL=... WEB_ORIGIN=...
fly deploy --config apps/api/fly.toml
```

Google OAuth is optional: set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to enable it.
