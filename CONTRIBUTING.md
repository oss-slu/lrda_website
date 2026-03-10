# Contributing to Where's Religion? Desktop

Thank you for your interest in contributing to _Where's Religion? Desktop_! We're excited to collaborate with students, developers, researchers, and community members. This guide will help you get started.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Issue Guidelines](#issue-guidelines)
- [Pull Request Process](#pull-request-process)
- [Commit Message Conventions](#commit-message-conventions)
- [Community & Support](#community--support)

---

## Code of Conduct

Please read our [Code of Conduct](./CODE_OF_CONDUCT.md) to understand the expectations for behavior in this project.

---

## Getting Started

To contribute to this project:

1. **Fork** the repository to your own GitHub account.
2. **Clone** your fork to your local machine:
   ```bash
   git clone https://github.com/YOUR_USERNAME/lrda_website.git
   ```

# Developer Setup Guide

This guide helps new contributors get the Where's Religion? web application running locally.

## Prerequisites

- **Node.js** 24+ (recommend using [nvm](https://github.com/nvm-sh/nvm))
- **pnpm** 10+ (install with `npm i -g pnpm`)
- **Git**

## Quick Start (5 minutes)

See [Environment Setup](#environment-setup) for configuring local auth

### 1. Clone and Install

```bash
git clone https://github.com/YOUR_USERNAME/lrda_website.git
cd lrda_website
pnpm install
```

### 2. Set Up Environment Variables

```bash
pnpm setup
```

This creates `packages/web/.env.local` and `packages/api/.env` with sensible defaults.

### 3. Apply Database Migrations

```bash
pnpm api:db:migrate
```

This creates the local D1 (SQLite) database and applies all schema migrations.

### 4. Start Everything

```bash
pnpm dev
```

This single command starts:

- **API server** (Cloudflare Workers via wrangler) on port 8787
- **Next.js frontend** on port 3000

Open [http://localhost:3000](http://localhost:3000) - the full stack is running!

> **Tip:** Use `Ctrl+C` to stop all services at once.

### 5. Seed the Database (Optional)

Populate the database with sample data so you have something to work with right away:

```bash
pnpm api:db:seed
```

### Alternative: Frontend Only

If you only need the frontend (pointing to a running API server):

```bash
pnpm dev:web
```

---

## Available Commands

| Command              | Description                              |
| -------------------- | ---------------------------------------- |
| `pnpm dev`           | Start API + frontend together            |
| `pnpm dev:api`       | Start API server only (port 8787)        |
| `pnpm dev:web`       | Start frontend only (port 3000)          |
| `pnpm api:db:migrate`| Apply D1 database migrations             |
| `pnpm api:db:generate`| Generate migrations from schema changes |
| `pnpm api:db:seed`   | Seed database with sample data           |
| `pnpm setup`         | Create .env files from examples          |
| `pnpm test`          | Run unit and e2e tests                   |
| `pnpm lint`          | Run ESLint                               |

Open [http://localhost:3000](http://localhost:3000) - you should see the app running.

---

## Environment Setup

### Required Environment Variables

Create `packages/web/.env.local` with the following:

```env
# API Server URL
NEXT_PUBLIC_API_URL=http://localhost:8787

# Google Maps (for map features)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

Create `packages/api/.env` with:

```env
BETTER_AUTH_SECRET=your-secret-key-here
```

> **Note:** Run `pnpm setup` to automatically create env files from the examples.

### Getting API Keys

- **Google Maps API Key**: Required for map features. Get one from [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
- **BETTER_AUTH_SECRET**: Generate a random string (e.g., `openssl rand -base64 32`)

### Request Team Credentials

For full access to the development environment, contact the team lead at yashkamal.bhatia@slu.edu.

---

## Architecture

- **Frontend**: Next.js (App Router) deployed to Cloudflare Workers via OpenNext
- **API**: Hono + Drizzle ORM deployed to Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Authentication**: better-auth (session-based, self-hosted)

---

## Common Issues

### Port Already in Use

```bash
# Kill processes on conflicting ports
lsof -ti:3000 -ti:8787 | xargs kill -9

# Or use pnpm's built-in port clearing
pnpm clear-ports
```

### Authentication Issues

If you're having trouble logging in:

1. Ensure the API server is running (`pnpm dev:api`)
2. Check that `NEXT_PUBLIC_API_URL` in `.env.local` is `http://localhost:8787`
3. Clear browser cookies and try again

---

## Development Workflow

### Running Tests

```bash
pnpm test          # All tests (unit + e2e)
pnpm test:unit     # Unit tests only (Jest)
pnpm test:e2e      # End-to-end tests (Playwright)
```

### Code Style

- We use TypeScript - avoid `any` types
- Use Tailwind CSS for styling
- Follow the patterns in existing components
- No emojis in code or commits

### Before Submitting a PR

1. Run `pnpm lint` and fix any issues
2. Run `pnpm test` and ensure tests pass
3. Test your changes locally
4. Update documentation if needed
