# Architecture Overview

Where's Religion? is a full-stack TypeScript platform with a web app, mobile app, and shared backend API.

## Architecture Diagram

An interactive architecture diagram is available as an Excalidraw file at [`architecture.excalidraw`](https://github.com/oss-slu/lrda_website/blob/main/architecture.excalidraw) in the repository root. Open it with [excalidraw.com](https://excalidraw.com/) for an interactive, zoomable view.

## High-Level Architecture

```
                    ┌─────────────────────────┐
                    │     Cloudflare Workers   │
                    │  ┌───────────────────┐   │
  Browser ────────► │  │   TanStack Start  │   │
                    │  │   (React 19 SSR)  │   │
                    │  └────────┬──────────┘   │
                    └───────────┼───────────────┘
                                │ HTTPS
                    ┌───────────▼───────────────┐
                    │     AWS Lightsail (Docker) │
                    │  ┌───────────────────┐    │
                    │  │   Hono API Server │    │
                    │  │   (Node.js)       │    │
                    │  └────────┬──────────┘    │
                    │           │                │
                    │  ┌────────▼──────────┐    │
                    │  │   PostgreSQL 17   │    │
                    │  └───────────────────┘    │
                    └───────────────────────────┘
```

## Tech Stack

| Layer | Technology | Notes |
| --- | --- | --- |
| **Frontend** | TanStack Start, React 19, Vite | File-based routing, SSR, server functions |
| **Styling** | Tailwind CSS | Utility-first, blue/white palette |
| **UI Components** | shadcn/ui (Radix primitives) | Primary; MUI only for rich text editor |
| **Rich Text** | Tiptap | Headless editor with 25+ extensions |
| **State** | Zustand (global), TanStack Query (server) | Modular stores, React Query for caching |
| **Maps** | Google Maps API | Via `@react-google-maps/api` |
| **API** | Hono + `@hono/zod-openapi` | OpenAPI-first, typed routes |
| **ORM** | Drizzle ORM | PostgreSQL dialect, generated migrations |
| **Database** | PostgreSQL 17 | Dockerized locally, managed on Lightsail |
| **Auth** | Better Auth | Session-based, cookie auth, self-hosted |
| **Web Deploy** | Cloudflare Workers | Via TanStack Start adapter |
| **API Deploy** | AWS Lightsail + Docker | Blue/green deploys with Nginx |

## Package Boundaries

```
@lrda/shared ──────► Zod schemas + TypeScript types
       │
       ├──► @lrda/api    (imports schemas for validation)
       │
       └──► web          (imports schemas for form validation + types)
```

- **`@lrda/shared`** owns all data shapes (notes, users, comments, admin). Both API and web import from it.
- **`@lrda/api`** is the single source of truth for data. It validates requests with shared schemas, talks to PostgreSQL via Drizzle, and handles auth.
- **`web`** is a thin client that calls the API. It uses TanStack Query for caching and Zustand for UI state.

## Key Architectural Decisions

- **Session-based auth over JWT**: Better Auth uses httpOnly cookies. Simpler CSRF model, no token refresh logic.
- **OpenAPI-first API**: Routes are defined with Zod schemas via `@hono/zod-openapi`, generating OpenAPI docs automatically.
- **Module-level singletons**: The `db` pool and `auth` instance are created once at startup, not per-request.
- **File-based routing**: TanStack Router generates route types from the filesystem, providing type-safe navigation.

## Mobile App

The companion mobile app ([`lrda_mobile`](https://github.com/oss-slu/lrda_mobile)) is a separate Expo/React Native application for iOS and Android. It provides the same core features (note creation, media capture, map exploration) but currently uses the legacy RERUM + Firebase backend. It is being migrated to use this same API.

See the [Mobile App docs](/mobile/overview) for details.

## Further Reading

- [Frontend Architecture](/architecture/frontend)
- [Backend Architecture](/architecture/backend)
- [Database](/architecture/database)
- [Authentication](/architecture/authentication)
- [Deployment](/architecture/deployment)
- [Mobile App](/mobile/overview)
