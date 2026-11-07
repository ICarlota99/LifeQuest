FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api/package.json apps/api/
COPY packages/domain/package.json packages/domain/
COPY packages/db/package.json packages/db/
RUN pnpm install --frozen-lockfile || pnpm install

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages ./packages
COPY . .
RUN pnpm --filter @lifequest/domain build \
 && pnpm --filter @lifequest/db build \
 && pnpm --filter @lifequest/api build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/domain/dist ./node_modules/@lifequest/domain/dist
COPY --from=build /app/packages/domain/package.json ./node_modules/@lifequest/domain/
COPY --from=build /app/packages/db/dist ./node_modules/@lifequest/db/dist
COPY --from=build /app/packages/db/package.json ./node_modules/@lifequest/db/
EXPOSE 3001
CMD ["node", "dist/index.js"]
