# ---- Stage 1: Install dependencies ----
FROM node:24-slim AS deps

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

# Copy workspace configuration + package.json files only (cache layer)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc* ./
COPY packages/api/package.json packages/api/
COPY packages/shared/package.json packages/shared/

# Install all deps (devDependencies needed for tsc build + drizzle-kit migrations)
# --no-optional skips firebase-admin (~100MB, only needed for sync scripts)
RUN pnpm install --frozen-lockfile --no-optional

# ---- Stage 2: Build ----
FROM node:24-slim AS build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/api/node_modules ./packages/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy source (shared package exports raw .ts, needed at compile time)
COPY packages/shared/ packages/shared/
COPY packages/api/ packages/api/

# Compile TypeScript -> dist/
WORKDIR /app/packages/api
RUN npx tsc --project tsconfig.build.json

# ---- Stage 3: Runtime ----
FROM node:24-slim AS runtime

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

# Copy compiled JS output
COPY --from=build /app/packages/api/dist/ ./packages/api/dist/

# Copy shared package source -- tsx needed at runtime because @lrda/shared
# exports raw .ts files and tsc doesn't rewrite import paths
COPY --from=build /app/packages/shared/ ./packages/shared/

# Copy node_modules (includes drizzle-kit for running migrations during deploy)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/api/node_modules ./packages/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy package.json files (needed for pnpm workspace resolution)
COPY --from=deps /app/package.json ./
COPY --from=deps /app/pnpm-workspace.yaml ./
COPY --from=deps /app/packages/api/package.json ./packages/api/
COPY --from=deps /app/packages/shared/package.json ./packages/shared/

# Copy drizzle config, schema, and migration files (needed for drizzle-kit migrate during deploy)
COPY --from=build /app/packages/api/drizzle.config.ts ./packages/api/
COPY --from=build /app/packages/api/src/db/schema.ts ./packages/api/src/db/
COPY --from=build /app/packages/api/drizzle/ ./packages/api/drizzle/

WORKDIR /app/packages/api

USER node
ENV NODE_ENV=production
EXPOSE 3002

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT || 3002) + '/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# tsx registers as a loader so @lrda/shared .ts imports resolve at runtime
CMD ["node", "--import", "tsx", "dist/index.js"]
