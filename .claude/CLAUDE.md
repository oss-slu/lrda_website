---
alwaysApply: true
description: "Core coding standards, architecture patterns, and conventions for LRDA Website monorepo"
---

# LRDA Website - Core Rules

## Project Overview

This is the **Where's Religion?** desktop web application - a Next.js project for documenting and mapping lived religion research. The app uses Firebase for authentication and data, Google Maps for mapping, and supports rich text editing with media uploads.

This is a **monorepo** containing:

- **Web package** (root): Next.js App Router application
- **Server package** (`server/`): Express.js REST API server
- **lrda-server-core package** (`packages/lrda-server-core/`): RERUM framework-based reusable server core library

## Architecture

### Monorepo Structure

```
lrda_website/
├── app/                    # Next.js App Router pages and components
├── components/             # Shared UI components (shadcn/ui)
├── server/                 # Express.js server
├── packages/
│   └── lrda-server-core/   # RERUM-based server core library
└── public/                 # Static assets
```

### Package Management

- **Package Manager**: pnpm (v10.20.0)
- **Node Version**: >=24.9.0
- **Workspace**: pnpm workspaces with three packages (web, server, lrda-server-core)

**Important**: Always use `pnpm --filter <package-name>` for package-scoped commands:

- `pnpm --filter server dev` - Run server in dev mode
- `pnpm --filter lrda-server-core test` - Test server core package
- `pnpm --filter . <command>` - Run command in root/web package

## Tech Stack

### Frontend (Web Package)

- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **UI Components**:
  - shadcn/ui (Radix primitives) - **Primary UI library**
  - MUI (Material UI) - **Use sparingly, only for rich text editor**
- **Rich Text Editor**: Tiptap with mui-tiptap
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query (@tanstack/react-query)
- **Maps**: Google Maps API (@react-google-maps/api)
- **Icons**: Lucide React (primary), MUI icons (secondary)

### Backend

- **Server Framework**: Express.js
- **Core Library**: RERUM API framework (lrda-server-core)
- **Database**: MongoDB
- **Authentication**: Firebase Admin SDK
- **Storage**: S3-compatible storage for media
- **API Documentation**: OpenAPI/Scalar

### Testing

- **Unit Tests**: Jest
- **E2E Tests**: Playwright
- **Test Location**: `app/__tests__/` (unit), `app/__e2e__/` (e2e)

## Coding Standards

### Critical Rules

1. **NO EMOJIS**: Do not use emojis in code, comments, documentation, or commit messages. This is a strict rule.
2. **Icons**: Use Lucide icons (`lucide-react`), MUI icons, or SVGs. Never use emojis as icons.
3. **TypeScript**: Use proper type annotations; avoid `any` when possible.
4. **Modern Syntax**: Prefer modern ES6+ syntax and features.
5. **Tests**: Only write tests when explicitly asked. Do not automatically generate tests.

### File Organization

- **Components**:
  - Custom components: `app/lib/components/`
  - shadcn/ui components: `components/ui/`
- **Utilities**: `app/lib/utils/`
- **Data Models**: `app/lib/models/`
- **Zustand Stores**: `app/lib/stores/`
- **Pages/Route Handlers**: `app/lib/pages/`
- **Hooks**: `app/lib/hooks/`
- **Configuration**: `app/lib/config/`
- **Constants**: `app/lib/constants/`
- **Server Routes**: `server/routes/`
- **Server Controllers**: `packages/lrda-server-core/controllers/`

### Import Guidelines

- Use the `@/` alias for imports from project root: `import { something } from '@/app/lib/utils'`
- Avoid deep relative paths like `../../../`
- Prefer absolute imports using `@/` alias
- Server-side imports can use relative paths within the server/package

### Code Organization Principles

- Keep files small, focused, and modular
- Avoid large monolithic files
- Split functionality into logically grouped modules
- Each file should handle one coherent responsibility

## Component Patterns

### React Components

- Prefer functional components with hooks
- Use TypeScript interfaces for component props
- Follow Next.js App Router conventions:
  - Server Components by default
  - Use `'use client'` directive only when needed (hooks, event handlers, browser APIs)
  - Route handlers in `app/api/`

### UI Components

- **Primary**: Use shadcn/ui components from `@/components/ui/`
- **Secondary**: Use MUI components only for rich text editor integration
- Customize shadcn/ui components with Tailwind classes
- Component composition over prop drilling

### State Management

- **Global State**: Zustand stores in `app/lib/stores/`
- **Server State**: TanStack React Query for server data
- **Local State**: React `useState` for component-specific state
- Keep Zustand stores focused and modular

### Example Component Structure

```typescript
"use client"; // Only if needed

import { Button } from "@/components/ui/button";
import { useStore } from "@/app/lib/stores/exampleStore";
import { LucideIcon } from "lucide-react";

interface ExampleProps {
  title: string;
  onAction: () => void;
}

export function ExampleComponent({ title, onAction }: ExampleProps) {
  const { state } = useStore();

  return (
    <div className="container">
      <Button onClick={onAction}>{title}</Button>
    </div>
  );
}
```

## Styling Guidelines

### Tailwind CSS

- Use Tailwind CSS for all styling
- Avoid inline styles
- Follow the project color palette: **blues and whites**
- Maintain consistent spacing and responsive design patterns
- Use Tailwind utility classes; customize in `tailwind.config.ts` if needed

### Responsive Design

- Mobile-first approach
- Use Tailwind breakpoints: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- Test responsive layouts

## Development Workflow

### Common Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm dev                              # Next.js dev server
pnpm --filter server dev              # Express server dev

# Testing
pnpm test                             # Run all tests
pnpm test:unit                        # Jest unit tests
pnpm test:e2e                         # Playwright e2e tests

# Building
pnpm build                            # Build Next.js app
pnpm --filter server build            # Build server (if applicable)

# Linting
pnpm lint                             # ESLint
pnpm lint:fix                         # ESLint with auto-fix

# Firebase Emulators
pnpm firebase:emulators               # Start Firebase emulators
pnpm dev:emulators                    # Next.js with emulators

# Docker (MongoDB)
pnpm docker:up                        # Start MongoDB container
pnpm docker:down                      # Stop MongoDB container
```

### Running Full Stack

1. Start MongoDB: `pnpm docker:up` (or external MongoDB)
2. Start server core: `pnpm --filter lrda-server-core start`
3. Start Express server: `pnpm --filter server dev`
4. Start Next.js app: `pnpm dev`

## Testing Guidelines

### Policy

- **Only write tests when explicitly requested**
- Do not automatically generate tests without being asked
- When writing tests:
  - Unit tests: `app/__tests__/` using Jest
  - E2E tests: `app/__e2e__/` using Playwright
  - Use React Testing Library for component tests

### Test Structure

- Unit tests: `.test.tsx` or `.test.ts` files
- E2E tests: `.spec.ts` files in `app/__e2e__/`
- Mock files: `app/__mocks__/` and `__mocks__/`

## Code Quality

### TypeScript

- Strict mode enabled
- Avoid `any` type
- Use proper type annotations
- Define interfaces for props and data structures
- Use type inference where appropriate

### Code Style

- Follow existing code formatting
- Use consistent naming conventions:
  - Components: PascalCase (`MyComponent.tsx`)
  - Utilities: camelCase (`myUtility.ts`)
  - Stores: camelCase (`myStore.ts`)
  - Constants: camelCase or UPPER_SNAKE_CASE

### Guardrails

- Do not commit build artifacts (`.next`, `dist`, `coverage`)
- Match existing formatting and TypeScript settings
- Avoid changing Node/TS configs unless necessary
- Use pnpm workspaces; prefer `--filter` for package-scoped commands
w