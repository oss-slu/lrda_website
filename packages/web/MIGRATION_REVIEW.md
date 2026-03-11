# TanStack Start Migration -- Quality Review

Date: 2026-03-11
Branch: `cloudflare-migration`

## Summary

Quality review of the Next.js App Router to TanStack Start migration in `packages/web/`.
Three parallel code reviews were run focusing on: (1) simplicity/DRY/elegance, (2) bugs/functional correctness, (3) project conventions/TanStack Start patterns.

---

## Fixed Issues

### CRITICAL -- Runtime Bugs

| # | Issue | File(s) | Fix |
|---|-------|---------|-----|
| 1 | `authClient.requestPasswordReset` does not exist in Better Auth | `forgot-password.tsx:22` | Changed to `authClient.forgetPassword` |
| 2 | Double URL-encoding of email (signup -> confirm) | `signup.tsx:134`, `confirm.tsx:8` | Removed `encodeURIComponent`/`decodeURIComponent`; TanStack Router handles encoding |
| 3 | DOMPurify top-level import crashes SSR (`window` access at import time) | `sanitize.ts:1` | Converted to lazy async `import('dompurify')` with type-only static import |
| 4 | Zustand `persist` uses `localStorage` by default -- crashes on Cloudflare Workers SSR | `authStore.ts:167` | Added `createJSONStorage` with SSR-safe noop fallback |

### HIGH -- Architectural / DRY

| # | Issue | File(s) | Fix |
|---|-------|---------|-----|
| 5 | `component` used instead of `shellComponent` for root document shell | `__root.tsx:41` | Switched to `shellComponent: RootDocument`, removed `RootComponent`/`Outlet` wrapper |
| 6 | DRY: admin.tsx duplicated cookie-forwarding fetch logic + 3rd copy of `API_URL` + `any` casts | `admin.tsx:8-44` | Replaced with `fetchFromAPI` from `auth/server.ts`, typed user as `UserProfile` |
| 7 | Dead Next.js API routes importing `next/server` | `app/api/tags/route.ts`, `app/api/s3-local/uploadFile/route.ts` | Deleted `app/api/` directory. Tags route converted to `createServerFn()` in `tags.service.ts`. S3-local route was dead (nothing called it). |
| 8 | 27 files with `'use client'` directives (no-ops in TanStack Start) | Various `app/lib/` files | Removed all directives from all 27 files |

### MEDIUM -- Code Quality

| # | Issue | File(s) | Fix |
|---|-------|---------|-----|
| 9 | `(res as any).error` duplicated in auth routes | `verify-email.tsx:41`, `reset-password.tsx:41` | Used typed destructured `{ error }` from Better Auth response |
| 10 | Login uses bespoke snack toast instead of globally mounted sonner | `login.tsx:37-144` | Replaced with `toast.error()`, removed `snackState`/`useEffect`/inline div |
| 12 | Duplicate import from `@tanstack/react-router` | `wheres-religion.tsx:1-2` | Merged into single import statement |
| 13 | Unicode arrow used as icon (violates CLAUDE.md) | `wheres-religion.tsx:44,407` | Replaced with `<ArrowLeft>` from `lucide-react` |

### LOW -- Polish

| # | Issue | File(s) | Fix |
|---|-------|---------|-----|
| 16 | Unused `React` namespace import; `React.useRef`/`React.useEffect` | `stories.tsx:2,56,58` | Changed to named imports |
| 17 | `<Suspense>` without `fallback` prop | `__root.tsx:70` | Added `fallback={null}` |

---

## Remaining Items

### `envPrefix: ['NEXT_PUBLIC_']` in `vite.config.ts`
- `import.meta.env.NEXT_PUBLIC_*` is build-time substitution only
- Wrangler `vars` in `wrangler.jsonc` are runtime bindings, not `import.meta.env`
- Works in local dev but production needs `.env.production` with correct values at build time
- **Action**: Verify `.env.production` contains correct API URL; consider renaming to `VITE_*` prefix long-term

### Test Files Reference Deleted Next.js Modules
- `app/__tests__/sidebar.test.tsx`, `navbar.test.tsx`, `publish_slider.test.tsx` import `next/router`, `next/navigation`
- **Action**: Update to use `@tanstack/react-router` mocks

### `notes.$id.tsx` Uses `useEffect` Instead of Route Loader
- Data fetched client-side in `useEffect` with manual loading/error state
- Idiomatic TanStack Router pattern is `loader` + `Route.useLoaderData()`
- **Action**: Convert to loader-based data fetching (enhancement, not a bug)

### `window.history.back()` in `notes.$id.tsx`
- Bypasses TanStack Router state management
- **Action**: Replace with `useNavigate()` or `router.history.back()`

### `auth/server.ts` Sends Empty Cookie Header
- `fetchFromAPI` line 39: `cookie: cookieHeader || ''` sends an empty cookie instead of returning null early
- Unauthenticated server-side API calls still fire, wasting a round-trip
- **Action**: Return null early when no cookie header is present

### Stale `compatibility_date` in `wrangler.jsonc`
- Currently `2025-04-01`, reference project uses `2025-09-24`
- **Action**: Update to latest when deploying

---

## Files Modified

```
-- Route files --
src/routes/__root.tsx          -- shellComponent pattern, Suspense fallback
src/routes/admin.tsx           -- fetchFromAPI, UserProfile type, removed duplication
src/routes/forgot-password.tsx -- forgetPassword method name
src/routes/signup.tsx          -- removed encodeURIComponent
src/routes/confirm.tsx         -- removed decodeURIComponent
src/routes/login.tsx           -- sonner toast, removed snack state
src/routes/verify-email.tsx    -- typed Better Auth response
src/routes/reset-password.tsx  -- typed Better Auth response
src/routes/wheres-religion.tsx -- merged import, Lucide ArrowLeft icon
src/routes/stories.tsx         -- named React imports

-- App library files --
app/lib/utils/sanitize.ts      -- async DOMPurify import (SSR-safe)
app/lib/stores/authStore.ts    -- SSR-safe localStorage for Zustand persist
app/lib/services/tags.service.ts -- converted from fetch('/api/tags') to createServerFn()
app/lib/components/stories/StoryDetailDialog.tsx -- async sanitizeHtml
app/lib/components/InstructorStoriesCard.tsx     -- async sanitizeHtml
app/lib/components/click_note_card.tsx           -- async sanitizeHtml

-- Removed 'use client' from 27 files --
app/notes/Notes.tsx
app/instructor-dashboard/InstructorDashboard.tsx
app/instructor-dashboard/InstructorSidebar.tsx
app/admin/AdminDashboard.tsx
app/lib/components/NoteEditor/NoteEditor.tsx
app/lib/components/NoteEditor/NoteEditorToolbar.tsx
app/lib/components/NoteEditor/NoteEditorContent.tsx
app/lib/components/NoteEditor/NoteEditorComments.tsx
app/lib/components/NoteEditor/NoteEditorHeader.tsx
app/lib/components/NoteEditor/AutoSaveIndicator.tsx
app/lib/components/NoteEditor/NoteElements/PublishToggle.tsx
app/lib/components/NoteEditor/NoteElements/NoteToolbar.tsx
app/lib/components/map/MapNotesPanel.tsx
app/lib/components/map/MapControls.tsx
app/lib/components/comments/CommentSidebar.tsx
app/lib/components/comments/CommentThreadList.tsx
app/lib/components/search_bar_map.tsx
app/lib/components/IconLink.tsx
app/lib/components/home/team_grid.tsx
app/lib/components/CollapsibleSection.tsx
app/lib/components/Sidebar.tsx
app/lib/components/login_button.tsx
app/lib/components/CommentStories.tsx
app/lib/components/icons.tsx
app/lib/utils/motion.ts
app/lib/hooks/useMapLocation.ts
app/lib/hooks/useMapIntro.ts

-- Deleted --
app/api/ (entire directory -- dead Next.js API routes)
```

## Verification

- TypeScript: zero errors (`tsc --noEmit`)
- Dev server: starts clean, all pages render (home 59KB, login 7KB, map 11KB, stories 8KB)
- No SSR errors in server logs
- Zero remaining `'use client'` directives in `app/` directory
- Zero remaining `next/server` imports
