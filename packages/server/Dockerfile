FROM node:24

# Use Corepack to ensure pnpm is available and consistent with the repo
WORKDIR /app

# Copy the workspace metadata and lockfile first to take advantage of layer caching
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Copy the packages so pnpm can link workspaces
COPY packages ./packages

# Enable corepack and prepare a stable pnpm version for reproducible installs
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

# Install workspace dependencies (frozen lockfile ensures repeatable builds)
RUN pnpm install --frozen-lockfile

# Start the server package (we set the working dir to the server folder so scripts run correctly)
WORKDIR /app/packages/server
CMD ["pnpm", "start"]
