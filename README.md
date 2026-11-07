# LifeQuest

D&D-inspired gamified personal development platform. Transform real-life goals into an RPG campaign with characters, skills, quests, bosses, and a coherent progression economy.

## Stack

- **Web:** React 19 + Vite + TypeScript + Tailwind CSS
- **API:** Hono + Better Auth
- **DB:** PostgreSQL + Drizzle ORM
- **Domain:** Pure TypeScript progression engine (`packages/domain`)

## Monorepo layout

```
apps/web          React frontend
apps/api          Hono REST API
packages/domain   Progression / reward / boss engines (no I/O)
packages/db       Drizzle schema, migrations, client
```

## Prerequisites

- Node.js 22+
- pnpm 9+
- Docker (for local Postgres)

## Quick start

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env and start Postgres (mapped to host port 5433)
cp .env.example .env
docker compose up -d

# 3. Push schema
pnpm db:push

# 4. Run API + web
pnpm dev
```

- Web: http://localhost:5173
- API: http://localhost:3001
- Health: http://localhost:3001/health

Local Postgres uses **port 5433** to avoid clashing with an existing Postgres on 5432.

With the API running, you can smoke-test the core loop:

```bash
pnpm smoke
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start API + web |
| `pnpm test` | Run unit/integration tests |
| `pnpm db:push` | Push Drizzle schema to Postgres |
| `pnpm db:generate` | Generate SQL migrations |
| `pnpm build` | Build all packages |

## Progression presets

- **Casual** — faster XP, higher daily caps, optional milestone gates
- **Balanced** — default economy
- **Hardcore** — slower XP, stricter gates (no punitive streak wipes)

## Deploy (free-tier target)

- Web → Cloudflare Pages
- API → Fly.io
- Postgres → Neon

See `apps/api/Dockerfile` and `apps/web/wrangler`-style notes in each app README.
