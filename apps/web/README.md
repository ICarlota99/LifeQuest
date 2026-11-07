# LifeQuest Web

React + Vite frontend for LifeQuest.

## Dev

```bash
pnpm --filter @lifequest/web dev
```

Set `VITE_API_URL` (default `http://localhost:3001`).

## Deploy (Cloudflare Pages)

1. Build command: `pnpm --filter @lifequest/web build`
2. Output directory: `apps/web/dist`
3. Set `VITE_API_URL` to your Fly.io API URL at build time.
