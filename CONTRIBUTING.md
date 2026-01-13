# Contributing to Where's Religion? Desktop

Thank you for your interest in contributing to _Where’s Religion? Desktop_! We're excited to collaborate with students, developers, researchers, and community members. This guide will help you get started.

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

- **Node.js** 18+ (recommend using [nvm](https://github.com/nvm-sh/nvm))
- **pnpm** (install with `npm i -g pnpm`)
- **Docker** (for local backend - [Install Docker](https://docs.docker.com/get-docker/))
- **Git**
- **Java** 21+ (for mac `brew install openjdk@21`)

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
- **Firebase Emulators** (Auth, Firestore, Storage)
- **Backend API server** on port 3001
- **Next.js frontend** on port 3000

Open [http://localhost:3000](http://localhost:3000) - the full stack is running!

> **Tip:** Use `Ctrl+C` to stop all services at once.

### Alternative: Minimal Setup (Frontend Only)

If you only need the frontend with Firebase emulators (no backend/S3):

```bash
# Terminal 1: Start Firebase emulators
pnpm firebase:emulators

# Terminal 2: Start frontend
pnpm dev:emulators
```

---

## Available Commands

| Command                   | Description                                              |
| ------------------------- | -------------------------------------------------------- |
| `pnpm dev:full`           | Start everything (Docker, Firebase, server, frontend)    |
| `pnpm dev:backend`        | Start Docker services + backend server only              |
| `pnpm dev:emulators`      | Start frontend with Firebase emulators                   |
| `pnpm dev`                | Start frontend only (requires separate Firebase/backend) |
| `pnpm services:up`        | Start Docker services (MongoDB, LocalStack)              |
| `pnpm services:down`      | Stop Docker services                                     |
| `pnpm firebase:emulators` | Start Firebase emulators                                 |
| `pnpm setup`              | Create .env files from examples                          |

Open [http://localhost:3000](http://localhost:3000) - you should see the app running.

---

## Environment Setup

### Option A: Use Firebase Emulators (Recommended)

The easiest way to get started - no Firebase account needed! Firebase Emulators run locally and provide full authentication, Firestore, and storage functionality.

**Step 1: Set up environment**

```bash
cp packages/web/.env.example packages/web/.env.local
```

The default `packages/web/.env.example` already has `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true` set.

**Step 2: Start Firebase Emulators (Terminal 1)**

```bash
pnpm firebase:emulators
```

This starts:

- **Auth Emulator** on port 9099
- **Firestore Emulator** on port 8080
- **Database Emulator** on port 9000
- **Storage Emulator** on port 9199
- **Emulator UI** on port 4000 - [http://localhost:4000](http://localhost:4000)

**Step 3: Start Next.js with Emulators (Terminal 2)**

```bash
pnpm dev:emulators
```

Or use the filter command: `pnpm --filter web dev:emulators`

Or use the filter command: `pnpm --filter web dev:emulators`

Open [http://localhost:3000](http://localhost:3000) - authentication and data storage will use local emulators!

**Emulator UI**: Visit [http://localhost:4000](http://localhost:4000) to view/edit users, Firestore data, and more.

**Persisting Data**: To save emulator data between sessions:

```bash
# Export data before stopping
pnpm firebase:emulators:export

# Start with previous data
pnpm firebase:emulators:import
```

---

### Option B: Use Mock/Demo Mode

For UI work that doesn't require authentication, you can use mock values:

```env
# packages/web/.env.local - Mock mode for UI development
NEXT_PUBLIC_FIREBASE_API_KEY=demo-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=demo.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=demo.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc
NEXT_PUBLIC_RERUM_PREFIX=http://localhost:3001/v1/
```

> **Note:** Authentication features will not work with mock values, but you can still work on UI components, styling, and non-auth features.

---

### Option C: Request Team Credentials

For full access to the development environment, contact the team lead at yashkamal.bhatia@slu.edu.

---

## Local Backend Setup

The backend uses MongoDB, a custom RERUM-compatible API server, and LocalStack for S3 emulation.

### Starting Services Manually

If you prefer to start services individually instead of using `pnpm dev:full`:

```bash
# Start Docker services
pnpm services:up

# Start the API server (in a separate terminal)
pnpm --filter server dev
```

Docker starts:

- **MongoDB** on port 27017
- **Mongo Express** (DB admin UI) on port 8081
- **LocalStack** (S3 emulator) on port 4566

### Initialize LocalStack S3 (Only needed for manual setup)

When using `pnpm dev:full` or `pnpm services:up`, the S3 bucket is created automatically.

For manual setup, after starting Docker, run:

> **Note:** You need the AWS CLI installed. Install with: `brew install awscli`

```bash
./scripts/init-localstack.sh
```

### Accessing Mongo Express (optional)

Open [http://localhost:8081](http://localhost:8081) with:

- Username: `mongoexpressuser`
- Password: `mongoexpresspass`

### Running the API Server

When using `pnpm dev:full`, the server starts automatically. For manual setup:

```bash
pnpm --filter server dev
```

The API server runs on [http://localhost:3001](http://localhost:3001).

> **Note:** The server uses `packages/server/.env`. Run `pnpm setup` to create it from the example.

### Stopping Services

```bash
# Stop everything (if using pnpm dev:full, just Ctrl+C)
pnpm services:down
```

---

## Common Issues

### "Firebase: No Firebase App" Error

Your Firebase environment variables are missing or invalid. Check that:

1. `packages/web/.env.local` exists in the web package directory
2. All `NEXT_PUBLIC_FIREBASE_*` variables have values (or use emulators)
3. You've restarted the dev server after changing `packages/web/.env.local`

### Firebase Emulator Issues

**Emulators won't start:**

```bash
# Check if ports are in use
lsof -ti:9099 -ti:8080 -ti:9000 -ti:9199 -ti:4000 | xargs kill -9
```

**"Not connected to emulators" in console:**

- Make sure you started the app with `pnpm dev:emulators` (not `pnpm dev`)
- Verify emulators are running: visit [http://localhost:4000](http://localhost:4000)

### Port 3000 Already in Use

```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9
# Or use a different port
pnpm dev -- -p 3001
```

### Docker Issues

```bash
# Reset Docker containers
cd packages/server
docker compose down -v
docker compose up -d
```

### MongoDB Connection Failed

Ensure Docker is running and the MongoDB container is healthy:

```bash
docker ps
docker logs server-mongo-1
```

---

## Development Workflow

### Running Tests

```bash
pnpm test          # Unit tests (Jest)
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
