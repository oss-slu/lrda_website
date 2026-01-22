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
- **Docker** (for local backend - [Install Docker](https://docs.docker.com/get-docker/))
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

This creates `packages/web/.env.local` and `packages/server/.env` with sensible defaults.

### 3. Start Everything

```bash
pnpm dev:full
```

This single command starts:

- **Docker services** (MongoDB, LocalStack S3)
- **Backend API server** on port 3002
- **Next.js frontend** on port 3000

Open [http://localhost:3000](http://localhost:3000) - the full stack is running!

> **Tip:** Use `Ctrl+C` to stop all services at once.

### Alternative: Frontend Only

If you only need the frontend (pointing to a running API server):

```bash
pnpm dev
```

---

## Available Commands

| Command            | Description                                       |
| ------------------ | ------------------------------------------------- |
| `pnpm dev:full`    | Start everything (Docker, API server, frontend)   |
| `pnpm dev:api`     | Start Docker services + API server only           |
| `pnpm dev`         | Start frontend only (requires separate API)       |
| `pnpm docker:up`   | Start Docker services (MongoDB, LocalStack)       |
| `pnpm docker:down` | Stop Docker services                              |
| `pnpm setup`       | Create .env files from examples                   |
| `pnpm test`        | Run unit and e2e tests                            |
| `pnpm lint`        | Run ESLint                                        |

Open [http://localhost:3000](http://localhost:3000) - you should see the app running.

---

## Environment Setup

### Required Environment Variables

Create `packages/web/.env.local` with the following:

```env
# API Server URL
NEXT_PUBLIC_API_URL=http://localhost:3002

# better-auth configuration
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000

# Google Maps (for map features)
NEXT_PUBLIC_MAP_KEY=your-google-maps-api-key
```

> **Note:** Run `pnpm setup` to automatically create env files from the examples.

### Getting API Keys

- **Google Maps API Key**: Required for map features. Get one from [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
- **BETTER_AUTH_SECRET**: Generate a random string (e.g., `openssl rand -base64 32`)

### Request Team Credentials

For full access to the development environment, contact the team lead at yashkamal.bhatia@slu.edu.

---

## Local Backend Setup

The backend uses MongoDB, a custom RERUM-compatible API server, and LocalStack for S3 emulation.

### Architecture

- **Authentication**: better-auth (session-based, self-hosted)
- **Database**: MongoDB (via Docker)
- **Media Storage**: LocalStack S3 emulator (via Docker)
- **API Server**: Express.js on port 3002

### Starting Services Manually

If you prefer to start services individually instead of using `pnpm dev:full`:

```bash
# Start Docker services
pnpm docker:up

# Start the API server (in a separate terminal)
pnpm dev:api
```

Docker starts:

- **MongoDB** on port 27017
- **Mongo Express** (DB admin UI) on port 8081
- **LocalStack** (S3 emulator) on port 4566

### Initialize LocalStack S3 (Only needed for manual setup)

When using `pnpm dev:full` or `pnpm docker:up`, the S3 bucket is created automatically.

For manual setup, after starting Docker, run:

> **Note:** You need the AWS CLI installed. Install with: `brew install awscli`

```bash
./scripts/init-localstack.sh
```

### Accessing Mongo Express (optional)

Open [http://localhost:8081](http://localhost:8081) with:

- Username: `mongoexpressuser`
- Password: `mongoexpresspass`

### API Server

When using `pnpm dev:full`, the server starts automatically. For manual setup:

```bash
pnpm dev:api
```

The API server runs on [http://localhost:3002](http://localhost:3002).

> **Note:** The server uses `packages/server/.env`. Run `pnpm setup` to create it from the example.

### Stopping Services

```bash
# Stop everything (if using pnpm dev:full, just Ctrl+C)
pnpm docker:down
```

---

## Common Issues

### Port Already in Use

```bash
# Find and kill the process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
pnpm dev -- -p 3001
```

### Docker Issues

```bash
# Reset Docker containers
pnpm docker:down
pnpm docker:up
```

### MongoDB Connection Failed

Ensure Docker is running and the MongoDB container is healthy:

```bash
docker ps
docker logs server-mongo-1
```

### Authentication Issues

If you're having trouble logging in:

1. Ensure the API server is running (`pnpm dev:api`)
2. Check that `NEXT_PUBLIC_API_URL` in `.env.local` points to the correct API server
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
