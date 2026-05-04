# LRDA Website -- Recommendations & Improvements

Comprehensive audit of the `packages/web/` and `packages/api/` codebases.
Each item includes reasoning, trade-offs, and a confidence level:

- **High** -- strongly recommended; clear benefit, low risk
- **Medium** -- worthwhile but context-dependent; weigh cost vs. benefit
- **Low** -- speculative or nice-to-have; tackle only if time permits

### Deployment Architecture (for context)

- **Frontend** (`packages/web/`): TanStack Start on Cloudflare Workers
- **API** (`packages/api/`): Hono + Drizzle on **AWS Lightsail** (Ubuntu, Docker, PostgreSQL 17 native, Nginx reverse proxy)
- **Deployment**: GitHub Actions -> GHCR Docker image -> SSH into Lightsail -> blue/green deploy with health checks
- **Cloudflare's role for API**: DNS proxy, Origin CA TLS, cache bypass rule, DDoS protection -- NOT the runtime
- **Database migrations**: `drizzle-kit migrate` (not push) -- applied during deploy

---

## Completed Items

The following recommendations from the original audit have been addressed:

- [x] **Router `defaultPreloadStaleTime`** -- Added `defaultPreloadStaleTime: 30_000` to `src/router.tsx`
- [x] **`public/_headers` for asset caching** -- Fixed path from `/_next/static/*` (Next.js holdover) to `/assets/*` (Vite)
- [x] **QueryClient `staleTime` defaults** -- Already had `staleTime: 5 * 60 * 1000` and `gcTime: 30 * 60 * 1000` in QueryProvider
- [x] **`useGlobalMapNotes` fetches ALL notes** -- Replaced with `useViewportNotes` hook: debounced viewport-based server queries (`fetchViewport` with `minLat/maxLat/minLng/maxLng`), `keepPreviousData`, 60s staleTime. Also supports global search mode (no bounds).
- [x] **API spatial index** -- Added composite index `note_published_coords_idx` on `(isPublished, latitude, longitude)` in schema + generated migration
- [x] **API summary mode** -- Added `fields=summary` query param to notes endpoint for lightweight map data (no text, limited media, no audio)
- [x] **Map search debouncing** -- `useDebounce` hook created and used for both bounds and search in `useViewportNotes` (400ms)
- [x] **CLAUDE.md architecture docs** -- Partially updated: migration context and packages section now accurately describe Lightsail/PostgreSQL. Architecture tree still has stale references to "D1 db factory" and "Cloudflare Workers config" in the API section.
- [x] **API `wrangler.jsonc` removed** -- Deleted since it was misleading and unused for production
- [x] **Map modal refactored** -- `ClickableNote` now takes `noteId` instead of full `Note` object; `modalNote` -> `modalNoteId` in mapStore (lighter state)
- [x] **Map `onLoad` simplified** -- Replaced separate `dragend` + `zoom_changed` listeners with single `idle` event (batches all viewport changes)
- [x] **Drizzle migrations** -- Switched from `drizzle-kit push` to `drizzle-kit migrate` in deploy scripts
- [x] **Dynamic import jsPDF/docx** -- Already dynamically imported in both `DownloadNote.tsx` and `NoteEditorToolbar.tsx`
- [x] **SEO titles on all routes** -- Added `head()` with `<title>` to all 16 routes, plus default title and description on root
- [x] **Root error component** -- Added `errorComponent` to root route; shows error in dev, refresh button in prod
- [x] **CLAUDE.md cleanup** -- Updated all stale references: D1 -> PostgreSQL, Workers -> Node.js, Next.js -> TanStack Start, wrangler -> @hono/node-server, port 8787 -> 3002
- [x] **CLAUDE.md architecture tree** -- Fixed remaining stale refs: "D1 db factory" -> "Drizzle schema and pg pool", "Cloudflare Workers config" removed from API section, "Key Patterns (Workers)" -> Node.js patterns
- [x] **Google Maps Provider lazy loading** -- `GoogleMapsProvider` now lazily loads the ~200KB Maps JS only when a component calls `useGoogleMaps()`. Pages without maps never load the script. Provider stays in root for context availability.
- [x] **HTTP Cache Headers** -- Added global request middleware in `src/start.ts` via `createStart`. Public pages (`/`, `/stories`, `/resources`, `/wheres-religion`, auth forms) get CDN-level `s-maxage` caching. Authenticated pages (`/notes`, `/map`, `/admin`, `/instructor-dashboard`) get `private, no-store`.
- [x] **Env prefix renamed** -- All `NEXT_PUBLIC_*` env vars renamed to `VITE_*`. Updated `envPrefix` in `vite.config.ts`, all `import.meta.env.*` references, CI workflows, `.env.example`, and documentation.

---

## 1. Architecture Shifts

### 1.1 Web: Route Protection via Layout Routes

Currently, protected routes (notes, instructor-dashboard) don't have server-side auth guards. The `/notes` and `/instructor-dashboard` routes render components that check auth client-side via Zustand. Only `/admin` uses a proper `beforeLoad` with `createServerFn` + redirect.

**Why**: Client-side auth checks flash unauthenticated content, are bypassable, and don't protect SSR'd HTML.

**Recommendation**: Create layout routes like paleo-waifu does:

- `_authenticated.tsx` -- layout with `beforeLoad` that checks session server-side, redirects to `/login` if missing
- Nest `/notes`, `/instructor-dashboard` under `_authenticated/`
- `_admin.tsx` -- layout with admin check

**Pros**: Single auth check for all protected routes; no flash of unauthenticated content; SSR-safe
**Cons**: Requires restructuring route files; need to set up `createServerFn` for session checking

**Confidence**: High -- security and UX improvement

---

### 1.2 Web: Add SEO & Head Management

The root route sets only `charset`, `viewport`, and `favicon`. No page has a `<title>`, description, or Open Graph tags.

**Why**: Published stories are shareable content. Without OG tags, links shared on social media show nothing. Without titles, browser tabs all say the same thing. Search engines can't index the site properly.

**Recommendation**:

- Root `head()`: Add default title ("Where's Religion?"), description, OG image
- `/stories` route: Dynamic title ("Stories | Where's Religion?")
- `/notes/$id` route: Dynamic title from note title, description from excerpt, OG image from first media
- `/map`: "Map | Where's Religion?"
- Add a `sitemap[.]xml.ts` route that lists all published notes

**Pros**: Massive SEO improvement; social sharing works; professional appearance
**Cons**: Minimal effort

**Confidence**: High -- essential for any public-facing site

---

### ~~1.3 Web: Add HTTP Cache Headers~~ (DONE)

Moved to Completed Items above.

---

### ~~1.4 CLAUDE.md: Finish Architecture Documentation Cleanup~~ (DONE)

Moved to Completed Items above.

---

## 2. Performance

### ~~2.1 Google Maps Provider Scope~~ (DONE)

Moved to Completed Items above.

---

### 2.2 Debounce Search in Stories Page

`StoriesPage` uses `searchQuery` directly in the infinite query key. Every keystroke triggers a new API request (the old one is cancelled, but it's still wasteful).

**Why**: Typing "religion" fires 8 requests, 7 of which are immediately abandoned. The `useDebounce` hook now exists in the codebase (created for the map viewport), so this is a trivial reuse.

**Recommendation**: Use the existing `useDebounce` hook:

```typescript
const [searchInput, setSearchInput] = useState('');
const debouncedSearch = useDebounce(searchInput, 400);
// use debouncedSearch in the query key
```

**Pros**: ~80% fewer API requests during search; smoother UX; hook already exists
**Cons**: Slight delay before results appear

**Confidence**: High -- trivial change, clear benefit

---

### 2.3 `notes.$id.tsx` Uses `useEffect` Instead of Route Loader

The note detail page fetches data in a `useEffect` with manual loading/error state. This means:

- No SSR (content loads client-side only)
- No loading skeleton during navigation
- Flash of "Loading..." text
- Note data can't be preloaded on hover

**Recommendation**: Use TanStack Router's `loader` with `createServerFn`:

```typescript
const fetchNote = createServerFn()
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    return fetchFromAPI<Note>(`/api/notes/${id}`);
  });

export const Route = createFileRoute('/notes/$id')({
  loader: ({ params }) => fetchNote({ data: params.id }),
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData?.title ?? 'Note' }],
  }),
  pendingComponent: NoteDetailSkeleton,
  component: NoteDetailPage,
});
```

**Pros**: SSR'd content; proper loading states; preloadable on link hover; SEO for published notes
**Cons**: Requires refactoring the component to use `Route.useLoaderData()` instead of `useState`

**Confidence**: High -- this is what TanStack Start is designed for

---

## 3. Security

### 3.1 Add Security Headers (Web)

The root layout doesn't set security headers. No CSP, no X-Frame-Options, no Referrer-Policy.

**Recommendation**: Add to root route's `headers()`:

```typescript
headers: () => ({
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' ...",
});
```

**Pros**: Prevents clickjacking, MIME sniffing, information leakage
**Cons**: CSP can be tricky to configure correctly (inline styles from Tiptap/MUI may need `'unsafe-inline'`)

**Confidence**: High -- standard security baseline

---

### 3.2 API: Add Rate Limiting

No rate limiting on any endpoint. The auth endpoints (`/api/auth/*`) are especially vulnerable to brute-force attacks. The Lightsail instance has limited resources (2GB RAM).

**Why**: Without rate limiting, a single attacker can exhaust the PostgreSQL connection pool or CPU.

**Recommendation** (layered approach):

1. **Cloudflare WAF rate rules** (edge, zero API changes): Rate-limit `/api/auth/*` to 5 req/min per IP. Already have Cloudflare proxying the API -- just add a rate limiting rule in the Cloudflare dashboard or via Terraform.
2. **Hono middleware** (application level): Add `hono-rate-limiter` or a simple in-memory rate limiter for API endpoints (100 req/min per user).

**Pros**: Prevents brute force; protects limited Lightsail resources; Cloudflare-level is free and zero-code
**Cons**: Cloudflare rate limiting rules have limited free tier; in-memory limiter resets on deploy

**Confidence**: High

---

### 3.3 Auth State in localStorage

`authStore` persists `user` and `isLoggedIn` to `localStorage`. This means:

- Stale user data persists after session expires server-side
- User profile (name, email, role, instructorId) is in localStorage indefinitely
- `isLoggedIn: true` can persist even when the session cookie is gone

**Why**: The `initialize()` function validates against the server, but there's a window where the UI shows stale auth state (flash of logged-in content before redirect).

**Recommendation**:

1. Only persist non-sensitive fields (userId, name) -- not role, email, instructorId
2. On initialize, if session check fails, clear persisted state immediately
3. Consider: do you even need localStorage persistence? The session cookie is the source of truth. On page load, just check the session and hydrate.

**Pros**: Less stale auth state; less sensitive data in localStorage
**Cons**: Slightly longer initial load if not persisting (need to wait for session check)

**Confidence**: Medium -- current approach works but has edge cases

---

### 3.4 `window.location.href` for Navigation

Multiple places use `window.location.href = '/'` for navigation (navbar logout, Notes sign-in button). This causes a full page reload, losing all client-side state.

**Recommendation**: Use TanStack Router's `useNavigate()` or `<Link>` component:

```typescript
const navigate = useNavigate();
navigate({ to: '/' });
```

**Pros**: SPA navigation; preserves state; faster
**Cons**: For logout, a full reload might actually be desired to clear all state (but you can `queryClient.clear()` + navigate instead)

**Confidence**: Medium -- the logout full-reload is arguably intentional for state clearing

---

## 4. Code Quality

### ~~4.1 Env Prefix: `NEXT_PUBLIC_` is Misleading~~ (DONE)

Moved to Completed Items above.

---

### 4.2 Inconsistent Naming Conventions

File names mix conventions:

- `snake_case`: `search_bar_map.tsx`, `note_card.tsx`, `click_note_card.tsx`, `use_extensions.ts`
- `PascalCase`: `NoteEditor.tsx`, `Sidebar.tsx`, `AuthProvider.tsx`, `CommentBubble.tsx`
- `camelCase`: `mapUtils.ts`, `authStore.ts`

**Recommendation**: Standardize:

- Components: `PascalCase.tsx` (e.g., `SearchBarMap.tsx`, `NoteCard.tsx`)
- Hooks: `camelCase.ts` (e.g., `useExtensions.ts`)
- Utils/services/stores: `camelCase.ts`

**Pros**: Consistent; predictable file discovery; matches React conventions
**Cons**: Lots of renames; git history disruption

**Confidence**: Medium -- cosmetic but worth doing during a major refactor

---

### 4.3 Replace MUI Long-Term

`NoteEditor.tsx` imports `createCache` from `@emotion/cache` and wraps everything in `<CacheProvider>`. `mui-tiptap` requires MUI + Emotion (~100-150KB gzipped).

**Why**: The rest of the app uses shadcn/ui. Having two UI libraries is costly.

**Recommendation** (phased):

1. Short-term: Ensure MUI is only imported in `NoteEditor` (tree-shaking)
2. Long-term: Replace `mui-tiptap` with custom Tiptap toolbar using shadcn/ui + Tiptap headless

**Pros**: Major bundle reduction; consistent UI; simpler dependency tree
**Cons**: Significant effort for the long-term option

**Confidence**: Medium -- high effort but high reward

---

### 4.4 No Error Boundaries

No error boundaries are visible in the app. If a component throws, the entire app crashes with a white screen.

**Recommendation**:

1. Add `errorComponent` to the root route for a global error fallback
2. Add `errorComponent` to critical routes (`/map`, `/notes`, `/stories`)
3. The map page especially should have error recovery (Google Maps can fail to load)

**Pros**: Graceful degradation; user can navigate away from broken pages; better error reporting
**Cons**: Minimal effort

**Confidence**: High -- essential for production

---

## 5. UX Improvements

### 5.1 Loading States / Skeleton UIs

Most routes show "Loading..." text or nothing while data loads.

**Recommendation**: Add `pendingComponent` with skeleton UIs to routes:

- `/stories`: Skeleton grid of cards (already has skeletons in `isLoading` but not as a `pendingComponent`)
- `/notes/$id`: Skeleton with header placeholder, text lines, media placeholders
- `/admin`: Skeleton dashboard cards
- `/instructor-dashboard`: Skeleton table

**Pros**: Perceived performance improvement; less layout shift; more polished
**Cons**: Need to create skeleton components

**Confidence**: High

---

### 5.2 Notes Page: No Auth Redirect

`/notes` renders a "Sign in to get started" card with a button that does `window.location.href = '/login'`. There's no server-side redirect.

**Why**: This means the notes page HTML is SSR'd and served to unauthenticated users, then they see a client-side prompt. It also means the notes route is crawlable by search engines showing a "sign in" page.

**Recommendation**: Add a `beforeLoad` redirect:

```typescript
export const Route = createFileRoute('/notes/')({
  beforeLoad: async () => {
    const user = await getServerUser();
    if (!user) throw redirect({ to: '/login' });
  },
  component: NotesPage,
});
```

**Pros**: Immediate redirect; no flash of unauthenticated content; cleaner
**Cons**: Need server function for session check

**Confidence**: High

---

### 5.3 Instructor Dashboard: No Auth Guard

`/instructor-dashboard` has no auth or role check whatsoever. It renders `<InstructorDashboard />` unconditionally. The component presumably handles this internally, but there's no server-side protection.

**Recommendation**: Add `beforeLoad` with instructor role check (similar to how `/admin` works).

**Pros**: Secure; no flash of unauthorized content
**Cons**: Minimal effort

**Confidence**: High

---

### 5.4 Toast Accessibility

Toast notifications use `sonner`. Ensure that toasts have proper ARIA roles and aren't the only way errors are communicated (some users may not notice transient toasts).

**Recommendation**: Audit toast usage -- for critical errors (save failures, delete failures), consider inline error states in addition to toasts.

**Pros**: Better accessibility; errors aren't missed
**Cons**: More UI to build

**Confidence**: Medium

---

## 6. Data Fetching

### 6.1 Comment Polling is Aggressive

Comments poll every 15 seconds (`refetchInterval: 15000`). For a note editing app, this is frequent. If 50 users have the editor open, that's 200 requests/minute hitting the Lightsail instance.

**Why**: The Lightsail instance has limited resources (2GB RAM, shared CPU). Excessive polling can saturate the PostgreSQL connection pool.

**Recommendation**:

1. Increase interval to 30-60 seconds
2. Only poll when the comment sidebar is open
3. Long-term: use WebSockets or SSE for real-time updates (Hono supports WebSocket upgrades)

**Pros**: ~50-75% fewer polling requests; lower Lightsail load
**Cons**: Slightly less real-time feel

**Confidence**: Medium -- depends on usage patterns and current user count

---

### 6.2 Student Notes Polling

`useStudentNotes` polls every 15 seconds. Same concern as comments -- multiplied by number of instructors.

**Recommendation**: Increase to 30-60 seconds. Consider adding a manual "Refresh" button for immediate updates.

**Pros**: Fewer requests
**Cons**: Less real-time

**Confidence**: Medium

---

### 6.3 Invalidation Strategy

Many places call `queryClient.invalidateQueries({ queryKey: notesKeys.all })`, which invalidates ALL notes queries (published, personal, viewport, detail, etc.). This is a sledgehammer approach.

**Recommendation**: Invalidate specifically:

```typescript
// After updating a note:
queryClient.invalidateQueries({ queryKey: notesKeys.detail(noteId) });
queryClient.invalidateQueries({ queryKey: notesKeys.personal(userId) });
// Only invalidate published/viewport if publish status changed
```

**Pros**: Fewer unnecessary refetches; snappier UX after mutations
**Cons**: More complex invalidation logic; risk of stale data if you miss a cache key

**Confidence**: Medium -- depends on how many notes exist

---

## 7. Bundle Size

### 7.1 MUI + Emotion Dependencies

(See 4.3 above -- same item, listed here for bundle context.)

~100-150KB gzipped solely for the Tiptap editor toolbar.

---

### 7.2 intro.js Loaded Globally

`intro.js` CSS is loaded in the root layout for all pages, but the tour only runs on `/map` and the note editor.

**Recommendation**: Lazy-load intro.js only on the pages that use it. Remove the CSS from root `head()` links and import it in the components that use `useMapIntro` / `useIntroTour`.

**Pros**: ~30KB less CSS on non-tour pages
**Cons**: Slight flash when tour CSS loads on demand (negligible with preloading)

**Confidence**: High -- easy win

---

### 7.3 `jsPDF` and `docx` Libraries

These are pulled in for note export (PDF/DOCX). They're large (~200KB+ combined) and only used when a user explicitly clicks "Download."

**Recommendation**: Dynamic import them:

```typescript
const handleDownloadPDF = async () => {
  const { jsPDF } = await import('jspdf');
  // ... generate PDF
};
```

**Pros**: Not loaded until needed; faster initial load
**Cons**: Slight delay on first download click

**Confidence**: High -- classic code splitting opportunity

---

## 8. API Improvements

### 8.1 API Response Pagination Metadata

The notes endpoint returns a bare array. Clients have no way to know total count or whether more pages exist without fetching the next page and checking if it's empty.

**Recommendation**: Return pagination metadata:

```json
{
  "data": [...],
  "total": 245,
  "limit": 20,
  "offset": 0,
  "hasMore": true
}
```

**Pros**: Clients can show total counts; proper infinite scroll without guessing; cursor-based pagination possible
**Cons**: Need to run a COUNT query (can cache); breaking API change

**Confidence**: High -- standard REST practice

---

### 8.2 API: Add Response Compression

Check if the Hono server is serving gzipped/brotli responses. Nginx may already handle this, but if the API is hit directly during local dev, responses could be uncompressed.

**Recommendation**: Either confirm Nginx handles compression in production, or add Hono compression middleware as a fallback:

```typescript
import { compress } from 'hono/compress';
app.use('*', compress());
```

**Pros**: Smaller response sizes (especially for note content with HTML); faster client parsing
**Cons**: Slight CPU overhead (negligible)

**Confidence**: Medium -- may already be handled by Nginx

---

### 8.3 API: PostgreSQL Connection Pool Tuning

The pool is configured with `max: 20` connections. On a 2GB Lightsail instance running PostgreSQL natively, this may be too many -- each PG connection uses ~5-10MB of memory.

**Recommendation**: Monitor connection usage. For a small-to-medium app, `max: 10` is likely sufficient. Add connection pool metrics to the `/health` endpoint:

```typescript
// In health route:
const poolStats = { total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount };
```

**Pros**: Better visibility into DB health; prevents OOM on the Lightsail instance
**Cons**: None

**Confidence**: Medium -- depends on concurrent user count

---

### 8.4 CORS: Hardcoded Development Origins

CORS config has hardcoded `localhost:3000` and `localhost:3002` for development, plus `CORS_ORIGINS` env var for production. The staging domain (`staging.wheresreligion.org`) needs to be in `CORS_ORIGINS`.

**Recommendation**: Verify that all deployment domains are in the CORS config. Consider using a pattern-based approach for subdomains:

```typescript
origin: origin => {
  if (!origin) return true; // server-to-server
  return allowedOrigins.includes(origin) || origin.endsWith('.wheresreligion.org');
};
```

**Pros**: Less configuration; supports new subdomains automatically
**Cons**: Slightly less strict (allows any subdomain)

**Confidence**: Medium

---

### 8.5 Database Backups: Add S3 Upload

The backup script (`backup-db.sh`) supports optional S3 upload but it's not configured (`BACKUP_S3_BUCKET` not set). Backups only exist on the Lightsail instance itself.

**Why**: If the Lightsail instance dies, backups are lost too. This is a single point of failure for data recovery.

**Recommendation**: Configure `BACKUP_S3_BUCKET` and `aws cli` on the instance. S3 storage is cheap (~$0.023/GB/month). Also consider enabling PostgreSQL WAL archiving for point-in-time recovery.

**Pros**: Off-site backups; disaster recovery; negligible cost
**Cons**: Need to set up IAM role or access key on the instance

**Confidence**: High -- critical for production data safety

---

## 9. Developer Experience

### 9.1 Type Safety Between API and Frontend

The API uses Zod schemas from `@lrda/shared`, and the frontend has its own `types.ts` with manually-maintained types. There's a `transformApiNote` / `transformNoteToApi` layer in `notes.service.ts` that bridges the gap.

**Why**: This transformation layer is a source of bugs. If the API schema changes, the frontend types may not update.

**Recommendation**:

1. Short-term: Use `z.infer<typeof NoteResponseSchema>` from `@lrda/shared` directly in the frontend instead of maintaining separate types
2. Long-term: Consider generating an API client from the OpenAPI spec (the API already serves `/openapi.json`)

**Pros**: Single source of truth for types; fewer transformation bugs; auto-generated client
**Cons**: Short-term option requires importing shared package; long-term option requires tooling setup

**Confidence**: High -- type drift is a real risk

---

### 9.2 Terraform State is Local

`terraform.tfstate` is stored locally (and is in the repo based on the infrastructure directory listing). This is risky -- if the state file is lost or gets out of sync, Terraform can't manage existing resources.

**Recommendation**: Move to remote state backend (S3 + DynamoDB for locking):

```hcl
terraform {
  backend "s3" {
    bucket         = "lrda-terraform-state"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
  }
}
```

**Pros**: State is durable; supports team collaboration; state locking prevents conflicts
**Cons**: Need to create S3 bucket and DynamoDB table; one-time migration

**Confidence**: High -- standard Terraform practice for any non-trivial setup

---

## 10. Quick Wins (Low Effort, High Impact)

| Item                                                | Effort              | Impact                          | Status                         |
| --------------------------------------------------- | ------------------- | ------------------------------- | ------------------------------ |
| ~~Add `staleTime` to QueryClient defaults~~         | 3 lines             | Fewer redundant refetches       | Done (5min/30min)              |
| ~~Add `defaultPreloadStaleTime` to router~~         | 1 line              | Faster navigation               | Done (30s)                     |
| ~~Fix `public/_headers` asset path~~                | 1 line              | CDN caching for static assets   | Done                           |
| ~~Viewport-based map notes~~                        | ~100 lines          | Scalable map loading            | Done                           |
| ~~Spatial index on notes~~                          | 1 line + migration  | Faster map queries              | Done                           |
| ~~Map search debouncing~~                           | ~50 lines           | Fewer API calls during pan/zoom | Done (400ms)                   |
| Debounce stories search input                       | ~5 lines            | 80% fewer search API calls      | **Todo** (reuse `useDebounce`) |
| ~~Dynamic import jsPDF/docx~~                       | ~5 lines each       | ~200KB off initial bundle       | Done (already dynamic)         |
| ~~Move Google Maps provider out of root~~           | ~20 lines           | ~200KB off non-map pages        | Done (lazy-load on first use)  |
| ~~Add `<title>` to all routes~~                     | 1 line each         | Basic SEO + default description | Done (all 16 routes)           |
| ~~Add `errorComponent` to root route~~              | ~15 lines           | Prevents white screen crashes   | Done                           |
| Add `beforeLoad` auth redirect to `/notes`          | ~5 lines            | Proper auth flow                | **Todo**                       |
| ~~Finish CLAUDE.md cleanup~~                        | ~15 min             | Prevents wrong assumptions      | Done                           |
| Configure S3 backup for PostgreSQL                  | ~15 min             | Off-site disaster recovery      | **Todo**                       |
| Add Cloudflare rate limiting rule for `/api/auth/*` | ~5 min in dashboard | Brute-force protection          | **Todo**                       |

---

## 11. Map Page -- Code Quality & Performance

Full-stack audit of the map page (`/map`), covering the API query path, frontend hooks, store, and rendering pipeline. Each issue verified against the code with file paths and line numbers.

### 11.1 React Root Memory Leak in Popups (Bug)

**Files**: `packages/web/app/lib/hooks/useMapMarkers.tsx:154-160`, `packages/web/app/lib/components/map/MapPopup.ts:60-63`

Every marker hover creates a `ReactDOM.createRoot(popupContent)` (useMapMarkers.tsx:155). When a new popup replaces the old one, `setMap(null)` triggers the OverlayView's `onRemove()`, which removes the DOM node from the page -- but the React root is never unmounted. The `root` variable is local to the mouseenter closure, so it's unreachable after the popup is replaced. The React fiber tree stays in memory.

Over a session with many hovers, this accumulates orphaned React trees.

**Fix**: Track each root alongside the popup and call `root.unmount()` before removing. For example, store the root on the popup instance or in a parallel ref.

**Confidence**: High -- this is a real memory leak

---

### 11.2 API Loads Full `text` Column in Summary Mode (Performance)

**File**: `packages/api/src/routes/notes.ts:257-276`

In summary mode, the Drizzle query loads every column including `text` (which contains HTML rich text -- can be large), then JS discards it:

```ts
// Line 257-266: loads everything
const results = await db.query.note.findMany({
  with: { media: true, audio: true },
  ...
});
// Line 268-275: strips in JS
const summaries = results.map(r => ({
  ...r,
  text: '',           // loaded from DB, then thrown away
  media: r.media.slice(0, 1),  // all media loaded, then truncated
  audio: [],          // all audio rows loaded, then discarded
}));
```

This wastes DB I/O, network bandwidth (DB -> API), and API memory.

**Fix**: Use Drizzle's column selection and conditional relation loading:

```ts
const results = await db.query.note.findMany({
  columns: isSummary ? { text: false } : undefined,
  with: {
    media: true,
    ...(isSummary ? {} : { audio: true }),
  },
  ...
});
// Still need to slice media to 1 in summary mode
```

**Confidence**: High -- measurable I/O reduction

---

### 11.3 Personal View Downloads ALL User Notes Without Summary Mode (Performance)

**Files**: `packages/web/app/lib/hooks/queries/useNotes.ts:82-94`, `packages/web/app/lib/services/notes.service.ts:160-164`

`usePersonalMapNotes` calls `fetchAllPages()` which loops through 200-item pages until exhausted:

```ts
// useNotes.ts:86-90
const data = await fetchAllPages((limit, offset) => notesService.fetchUserNotes(userId, limit, offset));
```

And `fetchUserNotes` doesn't pass `fields: 'summary'`:

```ts
// notes.service.ts:161
const qs = buildQueryString({ creatorId: userId, limit, offset: skip });
// No fields=summary, no bounds -- downloads full text, all media, all audio
```

For a researcher with hundreds of notes, this downloads every note's full content, all media, and all audio to the client, then filters by bounds in JS (map.tsx:127).

**Fix**: Use the same viewport-based server-side approach as global view. The API already supports `creatorId` + bounds + `fields=summary` together. Extend `fetchViewport` to accept an optional `creatorId` param, then use `useViewportNotes`-style querying for personal view too.

**Confidence**: High -- largest single data transfer optimization available

---

### 11.4 `createMarkerIcon` Parses HTML via `innerHTML` Per Marker (Performance)

**File**: `packages/web/app/lib/hooks/useMapMarkers.tsx:102-112`

Every marker calls `createMarkerIcon()` which creates a `<div>`, sets `innerHTML` with an SVG string, and returns it. For 200 markers, that's 200 HTML parse operations.

```ts
const createMarkerIcon = useCallback((): HTMLElement => {
  const div = document.createElement('div');
  div.classList.add('custom-marker');
  div.innerHTML = `<svg ...>...</svg>`;
  return div;
}, []);
```

**Fix**: Create one template element, then `cloneNode(true)` for each marker:

```ts
const templateIcon = useMemo(() => {
  const div = document.createElement('div');
  div.classList.add('custom-marker');
  div.innerHTML = `<svg ...>...</svg>`;
  return div;
}, []);

const createMarkerIcon = useCallback((): HTMLElement => templateIcon.cloneNode(true) as HTMLElement, [templateIcon]);
```

**Confidence**: High -- small change, eliminates redundant HTML parsing

---

### 11.5 Artificial 75ms Delay in Infinite Scroll (Performance)

**File**: `packages/web/app/lib/hooks/useInfiniteNotes.ts:59-62`

```ts
setTimeout(() => {
  setVisibleCount(prev => Math.min(prev + pageSize, items.length));
  setIsLoading(false);
}, 75);
```

This adds a 75ms delay to every page load. The comment says "allow spinner to render" but React batches state updates -- the spinner renders on the next frame regardless. This is a synchronous in-memory slice (`items.slice(0, visibleCount)`), not an async fetch, so no delay is needed.

**Fix**: Remove the `setTimeout`, update state synchronously:

```ts
setVisibleCount(prev => Math.min(prev + pageSize, items.length));
setIsLoading(false);
```

Or use `queueMicrotask()` if you still want a frame boundary.

**Confidence**: High -- minor but zero-risk cleanup

---

### 11.6 `google.maps.LatLngBounds` Stored in Zustand (Structure)

**File**: `packages/web/app/lib/stores/mapStore.ts:13`

```ts
mapBounds: google.maps.LatLngBounds | null;
```

Storing a Google Maps class instance in Zustand causes several problems:

- **Not serializable**: breaks devtools inspection, persistence, and SSR hydration
- **Can't be structurally compared**: two `LatLngBounds` with the same values are `!==`, which breaks memoization. The `boundsToParams()` utility in `mapUtils.ts` exists specifically to work around this.
- **Tight coupling**: the store depends on the Google Maps API being loaded before bounds can be set

**Fix**: Store plain data instead:

```ts
interface Bounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}
mapBounds: Bounds | null;
```

Convert from `LatLngBounds` at the point where the map's `idle` event fires (map.tsx:224), not in the store. This eliminates `boundsToParams()` as a utility since the store already holds the serialized form.

**Confidence**: High -- improves testability, serialization, and memoization

---

### 11.7 Three Redundant Map Click Handlers (Bug)

**Files**: `packages/web/src/routes/map.tsx:199-213,317-318`, `packages/web/app/lib/hooks/useMapMarkers.tsx:92-99,201-209`

On a single map click, `setActiveNote(null)` is called **three times**:

1. **`<GoogleMap onClick={handleMapClick}>`** (map.tsx:318) -- React component prop from `useMapMarkers.handleMapClick`
2. **`map.addListener('click', ...)`** (map.tsx:202) -- raw Google Maps listener in map.tsx useEffect
3. **`map.addListener('click', ...)`** (useMapMarkers.tsx:202) -- raw Google Maps listener in useMapMarkers useEffect

Handler #1 (from the hook) clears popup + active note. Handler #3 (also from the hook) does the same thing. Handler #2 (from map.tsx) only clears the active note.

There's also a similar duplication for dragstart: map.tsx:205 and map.tsx:317 (`onDragStart={handleMapClick}`).

**Fix**: Remove the useEffect in map.tsx (lines 198-213) entirely. The `<GoogleMap>` component props and the useMapMarkers internal listener already cover both click and drag scenarios. The map.tsx useEffect only adds the `dragstart` -> `setActiveNote(null)` behavior, which is already handled by `onDragStart={handleMapClick}`.

**Confidence**: High -- redundant handlers, easy to verify by removing and testing

---

### 11.8 17-Property Shallow Select from Map Store (Structure)

**File**: `packages/web/src/routes/map.tsx:57-82`

The map page destructures 17 properties from the store in a single `useShallow` call. Every render creates a new object with all 17 values and `useShallow` compares each one. This makes the component re-render on ANY store change, and it's hard to trace which state drives which behavior.

**Fix**: Split into focused selectors by concern:

```ts
// Viewport
const { mapCenter, mapZoom, mapBounds } = useMapStore(
  useShallow(s => ({ mapCenter: s.mapCenter, mapZoom: s.mapZoom, mapBounds: s.mapBounds })),
);
// UI
const isPanelOpen = useMapStore(s => s.isPanelOpen);
const isGlobalView = useMapStore(s => s.isGlobalView);
// Actions (stable references, no useShallow needed)
const setMapCenter = useMapStore(s => s.setMapCenter);
const setMapZoom = useMapStore(s => s.setMapZoom);
// etc.
```

Individual primitive selectors don't need `useShallow` since Zustand uses `Object.is` comparison by default. Only group related state that you always use together.

**Confidence**: Medium -- maintainability improvement, marginal perf gain

---

### 11.9 Excessive Ref-Based Closure Workarounds in useMapMarkers (Structure)

**File**: `packages/web/app/lib/hooks/useMapMarkers.tsx:42-69`

The hook uses 7 "keep current value" refs to avoid stale closures in marker event handlers:

```ts
const queryClientRef = useRef(queryClient); // line 42
const isPanelOpenRef = useRef(isPanelOpen); // line 45
const setActiveNoteRef = useRef(setActiveNote); // line 48
const setHoveredNoteIdRef = useRef(setHoveredNoteId); // line 51
const scrollToNoteTileRef = useRef(scrollToNoteTile); // line 54
const navigateRef = useRef(navigate); // line 58
const startPopupCloseTimerRef = useRef(startPopupCloseTimer); // line 88
```

Each is manually synced on every render (`ref.current = value`). This pattern works but is fragile, verbose, and easy to forget.

**Fix**: Create a `useLatest` utility hook that wraps a single object:

```ts
function useLatest<T>(value: T): React.MutableRefObject<T> {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

// In useMapMarkers:
const latest = useLatest({
  queryClient,
  isPanelOpen,
  setActiveNote,
  setHoveredNoteId,
  scrollToNoteTile,
  navigate,
  startPopupCloseTimer,
});
// In handlers: latest.current.navigate(...)
```

**Confidence**: Medium -- cleaner but same runtime behavior

---

### 11.10 `LIKE '%term%'` Search Cannot Use B-Tree Indexes (Performance)

**File**: `packages/api/src/routes/notes.ts:242-244`

```ts
const searchTerm = `%${query.search}%`;
conditions.push(or(like(note.title, searchTerm), like(note.text, searchTerm)));
```

Leading-wildcard `LIKE` patterns force PostgreSQL into a sequential scan regardless of existing indexes. As the notes table grows, search gets linearly slower.

**Fix (minimal, no application code changes)**: Enable the `pg_trgm` extension and add GIN trigram indexes:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX note_title_trgm_idx ON note USING GIN (title gin_trgm_ops);
CREATE INDEX note_text_trgm_idx ON note USING GIN (text gin_trgm_ops);
```

PostgreSQL automatically uses these indexes for `LIKE '%term%'` queries. No changes needed in the API code.

**Fix (full-text search, better long-term)**: Add a `tsvector` generated column with GIN index and use `ts_query` + `ts_rank` for ranked results. This also enables searching tags (currently skipped due to JSONB complexity).

**Confidence**: High -- `pg_trgm` is a drop-in improvement

---

### Map Issues Priority

| #     | Issue                            | Type      | Effort  | Impact                                 |
| ----- | -------------------------------- | --------- | ------- | -------------------------------------- |
| 11.1  | React root memory leak           | Bug       | ~15 min | Prevents memory growth during use      |
| 11.2  | API loads text in summary mode   | Perf      | ~20 min | Reduces DB I/O per viewport query      |
| 11.3  | Personal view fetches everything | Perf      | ~30 min | Largest data transfer fix              |
| 11.4  | innerHTML per marker             | Perf      | ~10 min | Eliminates redundant HTML parsing      |
| 11.5  | 75ms artificial delay            | Perf      | ~5 min  | Removes unnecessary latency            |
| 11.6  | LatLngBounds in store            | Structure | ~45 min | Serializable store, better memoization |
| 11.7  | Three click handlers             | Bug       | ~10 min | Removes redundant handler calls        |
| 11.8  | 17-property shallow select       | Structure | ~20 min | Clearer state dependencies             |
| 11.9  | Excessive refs                   | Structure | ~30 min | Cleaner hook code                      |
| 11.10 | LIKE search unindexed            | Perf (DB) | ~15 min | Index-backed text search               |

---

## Summary

The codebase is well-organized with clean separation of concerns, good TypeScript usage, and solid React patterns. The deployment infrastructure (Lightsail blue/green, Terraform IaC, GitHub Actions) is mature and well-designed. Recent work on the map page has addressed several major performance issues (viewport-based fetching, debounced queries, spatial indexing, summary mode).

The main remaining areas for improvement are:

1. **High priority**: SEO (no titles/meta), security headers, route protection, error boundaries, and cache headers are all missing and straightforward to add.
2. **Performance**: Google Maps loaded globally (~200KB on every page), jsPDF/docx loaded eagerly (~200KB), stories search not debounced.
3. **Map page**: Memory leak in popup React roots, redundant click handlers, personal view downloading all notes without summary mode, unindexed LIKE search.
4. **Infrastructure**: S3 backups not configured (single point of failure), no rate limiting, Terraform state is local.
5. **Medium priority**: Bundle optimization (MUI removal), consistent naming, type safety between API/frontend.
6. **Nice to have**: Polling optimization, granular cache invalidation, intro.js lazy loading.
