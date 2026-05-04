# Frontend Architecture

The web package (`packages/web/`) is a [TanStack Start](https://tanstack.com/start) application -- a full-stack React meta-framework built on Vite and TanStack Router.

## Framework Stack

- **TanStack Start**: SSR, server functions (`createServerFn`), file-based routing
- **React 19**: Latest React with concurrent features
- **Vite**: Dev server and build tooling
- **Tailwind CSS**: Utility-first styling (blue/white palette)

## Routing

Routes are defined as files in `src/routes/` using TanStack Router's file-based conventions:

```
src/routes/
  __root.tsx          # Root layout (navbar, providers)
  index.tsx           # / (home page)
  map.tsx             # /map
  notes.tsx           # /notes
  stories.tsx         # /stories
  resources.tsx       # /resources
  wheres-religion.tsx # /wheres-religion
  admin.tsx           # /admin
  instructor-dashboard.tsx
```

Each route uses `createFileRoute` and can define `loader`, `head`, and `component` exports.

## State Management

- **Zustand** for global UI state (stores in `app/lib/stores/`)
- **TanStack React Query** for server data caching and synchronization (hooks in `app/lib/hooks/queries/`)
- **React `useState`** for component-local state

## UI Components

- **Primary**: shadcn/ui components in `components/ui/` (built on Radix primitives)
- **Secondary**: MUI (Material UI) used sparingly, only for the Tiptap rich text editor integration via `mui-tiptap`
- **Icons**: Lucide React (primary), MUI icons (secondary)

## Deployment

The web app deploys to **Cloudflare Workers** using TanStack Start's Cloudflare adapter. Configuration is in `wrangler.jsonc`. Pre-rendered pages include `/`, `/resources`, and `/wheres-religion`.

## Key Directories

| Directory | Purpose |
| --- | --- |
| `app/lib/components/` | Custom application components |
| `app/lib/hooks/` | React hooks (data fetching in `queries/`) |
| `app/lib/stores/` | Zustand state stores |
| `app/lib/services/` | API service layer (`notes.service.ts`, etc.) |
| `app/lib/auth/` | Better Auth client and server config |
| `app/lib/utils/` | Utilities and constants |
| `app/types.ts` | Central type definitions |
| `components/ui/` | shadcn/ui generated components |
| `src/routes/` | File-based route definitions |
