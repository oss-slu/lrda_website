# GitHub Copilot Instructions

## Project Overview

This is the **Where's Religion?** desktop web application - a monorepo for documenting and mapping lived religion research. The app uses Google Maps for mapping, and supports rich text editing with media uploads.

### Monorepo Structure

```
lrda_website/
├── packages/
│   ├── api/                # PRIMARY API server (Hono + Drizzle + D1 on Cloudflare Workers)
│   │   ├── src/
│   │   │   ├── routes/     # API route handlers (notes.ts, users.ts, etc.)
│   │   │   ├── db/         # Drizzle schema and D1 db factory
│   │   │   └── middleware/  # Auth + DB middleware
│   │   ├── drizzle/        # Generated SQL migrations
│   │   └── wrangler.jsonc  # Cloudflare Workers config
│   └── web/                # Next.js App Router application
│       └── wrangler.jsonc  # Cloudflare Workers config (OpenNext)
```

The **primary backend** is `packages/api/` (Hono + Drizzle + Cloudflare D1). The frontend (`packages/web/`) talks to it via `NEXT_PUBLIC_API_URL` (port 8787 locally). When looking for API endpoints, always check `packages/api/src/routes/` first.

## Tech Stack

### Frontend (`packages/web/`)

- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix primitives) -- primary; MUI -- only for rich text editor
- **Rich Text Editor**: Tiptap with mui-tiptap
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query
- **Maps**: Google Maps API (@react-google-maps/api)
- **Icons**: Lucide React (primary), MUI icons (secondary)
- **Deployment**: Cloudflare Workers via @opennextjs/cloudflare

### Backend (`packages/api/`)

- **Runtime**: Cloudflare Workers
- **Server Framework**: Hono (with `@hono/zod-openapi`)
- **ORM**: Drizzle ORM (SQLite dialect)
- **Database**: Cloudflare D1 (SQLite)
- **Authentication**: Better Auth (session-based with cookies)
- **API Documentation**: OpenAPI/Scalar

### General

- **Testing**: Jest (unit), Playwright (e2e)
- **Package Manager**: pnpm

## Coding Standards

- Do not use emojis in code, comments, documentation, or commit messages.
- For UI icons, use Lucide icons (`lucide-react`), MUI icons, or SVGs. Never use emojis as icons.
- Follow Next.js App Router conventions and best practices.
- Use TypeScript with proper type annotations; avoid `any` when possible.
- Prefer modern ES6+ syntax and features.

## File Organization

- Keep files small, focused, and modular. Avoid large monolithic files.
- Split functionality into logically grouped modules.
- Each file should handle one coherent responsibility.
- Use the `@/` alias for imports from the project root.
- Frontend components: `packages/web/app/lib/components/` or `packages/web/components/ui/` (shadcn).
- Frontend utilities: `packages/web/app/lib/utils/`.
- Zustand stores: `packages/web/app/lib/stores/`.
- API routes: `packages/api/src/routes/`.
- API DB schema: `packages/api/src/db/schema.ts`.

## Styling Guidelines

- Use Tailwind CSS for styling; avoid inline styles.
- Follow the project color palette: blues and whites.
- Use shadcn/ui components when available; customize with Tailwind classes.
- Maintain consistent spacing and responsive design patterns.

## Component Guidelines

- Prefer functional components with hooks.
- Use shadcn/ui components (`@/components/ui/`) for common UI patterns.
- Use MUI components sparingly, primarily for the rich text editor integration.
- Keep component props well-typed with TypeScript interfaces.

## Testing

- Only write tests when asked. Do not automatically generate tests without being asked.
- Write Jest unit tests in `app/__tests__/` for utilities and components.
- Write Playwright e2e tests in `app/__e2e__/` for user flows.
- Run tests with `pnpm test` (unit) or `pnpm test:e2e` (e2e).

## Environment & Configuration

- Use `.env.local` for local environment variables.
- Never commit secrets or API keys.
- Prefer config files over hardcoded values.
