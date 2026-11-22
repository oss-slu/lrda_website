# The Where's Religion? Web Application

**Product Owner:** [Adam Park](https://github.com/park353) | Part of the [Where's Religion](https://wheresreligion.org) project, funded by the Henry Luce Foundation and developed through [Open Source with SLU](https://github.com/oss-slu).

## Overview

Where's Religion? is a collaborative platform designed for diverse users with interests in sharing media and notes about their respective encounters with "religion" in everyday places.

Researchers, students, and instructors write field notes with rich text, photos, audio, and video, pin them to a location, and publish them to a shared map at [wheresreligion.org](https://wheresreligion.org). Instructors can review and approve the notes of the students in their courses, and anyone can browse published notes without an account.

This repository holds the desktop web application and the API behind it:

- **Web app** (`packages/web`): the site at wheresreligion.org, for writing, publishing, and exploring notes on the map.
- **API** (`packages/api`): the REST API at api.wheresreligion.org. It handles accounts, notes, and media, and is shared by the web app and the [mobile app](https://github.com/oss-slu/lrda_mobile), which has no backend of its own.
- **Docs** (`packages/docs`): the developer documentation site at docs.wheresreligion.org.

## Tech Stack

| Area         | Technologies                                                                                   |
| ------------ | ---------------------------------------------------------------------------------------------- |
| Web frontend | React 19, TanStack Start and Router (Vite), TanStack Query, Zustand, Tailwind CSS 4, shadcn/ui |
| API          | Node.js 24, Hono with OpenAPI (Zod), Drizzle ORM, PostgreSQL 17, Better Auth                   |
| Docs site    | VitePress                                                                                      |
| Deployment   | Web and docs on Cloudflare Workers (Wrangler); API on AWS Lightsail with Docker                |
| Testing      | Vitest (unit and integration), Playwright (end-to-end)                                         |
| Tooling      | pnpm workspaces, TypeScript, ESLint, Prettier                                                  |

## Getting Started

**Prerequisites:** Node.js 24+, pnpm 10+, and [Docker](https://www.docker.com/products/docker-desktop/) (the local PostgreSQL database runs in a container).

```bash
# Clone and install
git clone https://github.com/oss-slu/lrda_website.git
cd lrda_website
pnpm install

# Set up environment files (use "pnpm run setup": plain "pnpm setup" runs pnpm's own installer instead)
pnpm run setup

# Start everything (database, API, frontend, and docs)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) - the full stack is running! The API runs on port 3002 and the docs site on port 3001.

> **Windows:** `pnpm run setup` and `pnpm dev` use Unix commands (`cp`, `lsof`, `sleep`) and fail in Windows shells. Copy `packages/web/.env.example` to `packages/web/.env.local` and `packages/api/.env.example` to `packages/api/.env`, then run `pnpm api:docker:up`, `pnpm api:db:push`, and `pnpm exec concurrently -k "pnpm dev:api" "pnpm dev:web"`.

> **New Contributors:** See our detailed [Contributing Guide](CONTRIBUTING.md) for more options and troubleshooting.

## Project Structure

This is a monorepo with the following packages:

- `packages/api/` - Hono REST API (Node.js + PostgreSQL) on AWS Lightsail
- `packages/web/` - TanStack Start application on Cloudflare Workers
- `packages/docs/` - VitePress developer documentation site
- `packages/shared/` - Zod schemas and types shared by the web app and the API
