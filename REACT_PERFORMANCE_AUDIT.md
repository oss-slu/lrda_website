# React Performance Audit -- Vercel Best Practices

**Codebase:** Where's Religion? (LRDA Website)
**Date:** 2025-03-10
**Framework:** Next.js 16 (App Router) + TanStack Query + Zustand
**Methodology:** Audited against Vercel Engineering's React Best Practices (v1.0.0) -- 58 rules across 8 categories.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Findings by Category](#findings-by-category)
   - [1. Eliminating Waterfalls (CRITICAL)](#1-eliminating-waterfalls-critical)
   - [2. Bundle Size Optimization (CRITICAL)](#2-bundle-size-optimization-critical)
   - [3. Server-Side Performance (HIGH)](#3-server-side-performance-high)
   - [4. Client-Side Data Fetching (MEDIUM-HIGH)](#4-client-side-data-fetching-medium-high)
   - [5. Re-render Optimization (MEDIUM)](#5-re-render-optimization-medium)
   - [6. Rendering Performance (MEDIUM)](#6-rendering-performance-medium)
   - [7. JavaScript Performance (LOW-MEDIUM)](#7-javascript-performance-low-medium)
   - [8. Advanced Patterns (LOW)](#8-advanced-patterns-low)
3. [Strengths Summary](#strengths-summary)
4. [Recommendations Summary](#recommendations-summary)
5. [Priority Action Items](#priority-action-items)

---

## Executive Summary

The codebase demonstrates strong fundamentals: well-structured TanStack Query hooks with key factories, good Zustand usage with `useShallow`, optimistic mutation updates, and clean separation of concerns. The main areas for improvement are in **bundle optimization** (barrel files, lack of dynamic imports for heavy components), **waterfall elimination** (sequential fetches in several components), and **underutilization of Server Components** (almost everything is marked `'use client'`).

| Category | Grade | Notes |
|----------|-------|-------|
| Eliminating Waterfalls | C+ | Several sequential fetches; good Promise.all in admin |
| Bundle Size | C | Barrel files everywhere; no dynamic imports for heavy libs |
| Server-Side Performance | D+ | Almost no Server Component usage; everything is client |
| Client-Side Data Fetching | B+ | TanStack Query well-used; good dedup and caching |
| Re-render Optimization | B | Good useShallow/useMemo use; some opportunities missed |
| Rendering Performance | B- | Decent patterns; missing content-visibility for lists |
| JavaScript Performance | B | Clean code; minor sort/filter optimizations possible |
| Advanced Patterns | B | Good lazy state init in QueryProvider; ref patterns used |

---

## Findings by Category

### 1. Eliminating Waterfalls (CRITICAL)

#### Issues Found

**1a. Sequential fetches in `notes/[id]/page.tsx` (lines 63-90)**

The note detail page fetches the note, then sequentially fetches the creator name. These are dependent (creator name needs `n.creator`), but `fetchCreatorName` and `sanitizeHtml` could start in parallel once the note arrives:

```typescript
// Current: sequential
notesService.fetchById(noteId).then((n) => {
  setNote(n);
  fetchCreatorName(n.creator).then(...);  // waits for note
  setSanitizedContent(sanitizeHtml(n.text, ...));
});
```

**Recommendation:** Use `Promise.all` for the creator name and sanitization once the note is fetched. Better yet, convert this to a TanStack Query hook (this page manually manages loading/error state with `useState` instead of using the query infrastructure the rest of the app uses).

**1b. Auth store `initialize()` has a waterfall (`authStore.ts` lines 126-164)**

`getCurrentSession()` is awaited, then `fetchMe()` is called sequentially. Since `fetchMe` requires a valid session cookie (not the response data), both could start in parallel:

```typescript
// Current: sequential
const response = await getCurrentSession();
if (response.data?.session) {
  const profile = await fetchMe();  // doesn't use response data
}
```

**1c. Auth store `login()` and `signup()` have the same pattern (`authStore.ts` lines 40-107)**

After `signInWithEmail`, `fetchMe()` is called. The session cookie is set by the sign-in response, so this is a true dependency. No improvement needed here.

**1d. `enrichCommentsWithAuthorNames` (`useComments.ts` lines 15-31) -- GOOD**

This correctly uses `Promise.all` to fetch all author names in parallel. Well done.

**1e. Admin dashboard (`AdminDashboard.tsx` line 74) -- GOOD**

Correctly uses `Promise.all` for stats, users, and applications.

#### Pros
- `Promise.all` used correctly in admin dashboard and comment enrichment
- TanStack Query's built-in parallel fetching used on map page (both `useGlobalMapNotes` and `usePersonalMapNotes` fire simultaneously)

#### Cons
- Note detail page uses manual `useEffect` + `useState` instead of query hooks, creating waterfalls
- Auth initialization could parallelize session check and profile fetch

---

### 2. Bundle Size Optimization (CRITICAL)

#### Issues Found

**2a. Barrel files used extensively**

5 barrel files identified, all actively imported from:

| Barrel File | Exports | Imported From |
|-------------|---------|---------------|
| `services/index.ts` | 20+ exports from 8 modules | Multiple components |
| `NoteEditor/index.ts` | 15+ exports with `export *` | Map page, notes page |
| `hooks/queries/index.ts` | `export *` from 3 modules | Multiple components |
| `components/map/index.ts` | 4 named exports | Map page |
| `auth/index.ts` | 10+ exports | Auth store, components |

The `services/index.ts` barrel is the most impactful -- it re-exports from 8 service files, meaning importing `{ notesService }` also causes the bundler to evaluate admin, instructor, media, tags, and comments services.

**Recommendation:** Either:
1. Add `optimizePackageImports` in `next.config.js` for internal barrel files
2. Import directly from source files (e.g., `from './notes.service'` instead of `from '../services'`)

Note: Some components already import directly (e.g., `notes/[id]/page.tsx` imports from `'@/app/lib/services/notes.service'` AND from `'@/app/lib/services'`). Standardize on direct imports.

**2b. No dynamic imports for heavy components**

The codebase has zero uses of `next/dynamic`. Heavy components that should be dynamically imported:

| Component | Why | Impact |
|-----------|-----|--------|
| Google Maps (`@react-google-maps/api`) | ~100KB+ library, only used on `/map` | HIGH |
| Tiptap rich text editor | Large dependency tree, only used in NoteEditor | HIGH |
| `react-h5-audio-player` | Only used in AudioPicker | MEDIUM |
| MUI / tss-react / Emotion | Only needed for editor toolbar | MEDIUM |
| `intro.js` | Already dynamically imported in `useMapIntro` -- GOOD | -- |

**Recommendation:** Use `next/dynamic` with `{ ssr: false }` for map and editor components.

**2c. `ReactQueryDevtools` loaded in production (`QueryProvider.tsx` line 4)**

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
```

This is imported unconditionally. In production builds, TanStack Query devtools are tree-shaken to an empty component, so this is low-impact in Next.js. However, it still adds to dev bundle parse time.

**2d. Lucide icons imported from barrel**

Multiple files import from `lucide-react` barrel:
- `AdminDashboard.tsx`: 10 icons from `'lucide-react'`
- `notes/[id]/page.tsx`: 8 icons from `'lucide-react'`
- Many other components

Next.js has `lucide-react` in its default `optimizePackageImports` list, so this is auto-optimized at build time. No action needed unless dev server performance is poor.

**2e. MUI/Emotion loaded globally in root layout (`layout.tsx` line 6)**

```typescript
import { NextAppDirEmotionCacheProvider } from 'tss-react/next/appDir';
```

The Emotion cache provider wraps the entire app, but MUI/Emotion is only used in the rich text editor. This adds CSS-in-JS overhead to every page.

**Recommendation:** Move `NextAppDirEmotionCacheProvider` to only wrap the NoteEditor component or the notes route group.

#### Pros
- `intro.js` is already dynamically imported (good pattern)
- Lucide icons auto-optimized by Next.js

#### Cons
- 5 barrel files causing unnecessary module evaluation
- Zero `next/dynamic` usage for heavy components
- Emotion/MUI cache provider wraps entire app unnecessarily

---

### 3. Server-Side Performance (HIGH)

#### Issues Found

**3a. Almost zero Server Component usage**

47 out of ~50 component files use `'use client'`. Even page-level components that could benefit from server rendering are client-only:

- `app/stories/page.tsx` -- `'use client'`
- `app/map/page.tsx` -- `'use client'`
- `app/notes/[id]/page.tsx` -- `'use client'`
- `app/admin/page.tsx` -- likely wraps a client component

The admin page (`admin/page.tsx`) appears to follow a good pattern -- it's a server component that fetches initial data and passes it to the `AdminDashboard` client component. This is the recommended pattern.

**Recommendation:** For pages like `notes/[id]/page.tsx`, the note fetch could happen server-side with the result passed to a client component for interactivity. This would:
- Eliminate the loading spinner
- Enable SEO for shared note URLs
- Reduce client-side JavaScript

**3b. No `React.cache()` usage**

No per-request deduplication is used. For the current architecture (API server is separate), this is less impactful since data fetching happens client-side via TanStack Query. However, if any server components are added, `React.cache()` should be used for shared data.

**3c. No `after()` usage**

The `after()` API (Next.js 15+) for non-blocking operations like logging/analytics is not used. Minor impact for this codebase.

**3d. Admin page follows good RSC + client pattern**

`app/admin/page.tsx` fetches data server-side and passes it as props to `AdminDashboard`. This is the correct pattern for pages that need both server data and client interactivity.

#### Pros
- Admin page demonstrates correct Server Component + Client Component composition
- Separate API server means less server-side optimization pressure on Next.js

#### Cons
- Vast majority of the app is client-rendered unnecessarily
- No Server Component data fetching for SEO-important pages (note detail, stories)
- Missed opportunity for streaming with Suspense boundaries on data-heavy pages

---

### 4. Client-Side Data Fetching (MEDIUM-HIGH)

#### Issues Found

**4a. TanStack Query well-configured -- GOOD**

`QueryProvider.tsx` demonstrates several best practices:
- Lazy state initialization: `useState(() => new QueryClient(...))` (rule: `rerender-lazy-state-init`)
- Sensible defaults: 5min staleTime, 30min gcTime, retry: 1
- `refetchOnWindowFocus: false` prevents unnecessary refetches
- Centralized error handling via QueryCache and MutationCache

**4b. Query key factory pattern -- GOOD**

Both `notesKeys` and `commentsKeys` follow the recommended factory pattern for type-safe, hierarchical cache invalidation.

**4c. Optimistic updates in comment mutations -- GOOD**

`useCommentMutations` correctly implements optimistic updates with rollback:
- Cancels outgoing queries
- Snapshots previous data
- Optimistically updates cache
- Rolls back on error

**4d. Polling intervals appropriate**

- Comments: 15s polling with `refetchIntervalInBackground: false`
- Student notes: 15s polling
- These are reasonable for collaborative editing scenarios.

**4e. `useCommentPreview` derives from shared cache -- GOOD**

`useCommentPreview` calls `useComments` internally, sharing the same query cache entry. This avoids duplicate network requests.

**4f. No localStorage versioning**

`authStore.ts` uses Zustand `persist` middleware to store auth data in localStorage, but there's no schema versioning:

```typescript
persist(
  (set, get) => ({ ... }),
  {
    name: 'auth-store',
    partialize: state => ({
      user: state.user,
      isLoggedIn: state.isLoggedIn,
    }),
  },
)
```

If the `UserProfile` type changes, stale data could cause runtime errors.

**Recommendation:** Add a `version` and `migrate` function to the persist config.

#### Pros
- Excellent TanStack Query setup with proper defaults
- Query key factories for clean cache management
- Optimistic updates with rollback in mutations
- Smart cache sharing via `useCommentPreview`
- Good polling strategies

#### Cons
- No localStorage schema versioning for persisted Zustand stores
- Note detail page bypasses TanStack Query entirely (manual useEffect fetching)

---

### 5. Re-render Optimization (MEDIUM)

#### Issues Found

**5a. Zustand `useShallow` used correctly -- GOOD**

The map page (`map/page.tsx` lines 52-75) uses `useShallow` to avoid re-renders when accessing multiple store values. This prevents unnecessary re-renders when unrelated store values change.

**5b. Derived state computed correctly -- GOOD**

Map page computes `notes` and `filteredNotes` as `useMemo` derived values rather than storing them in state. This follows the "derive state during render" rule.

**5c. Excessive dependency array in `useNoteSync` (`useNoteSync.ts` lines 203-218)**

The sync effect has 13 dependencies:
```typescript
}, [notes, currentNoteId, stateNoteId, editorContent, initialNote,
    title, isPublished, approvalRequested, tags, images, videos, audio,
    editor, lastEditTimeRef]);
```

This effect fires on nearly every state change, which is the opposite of what the "narrow effect dependencies" rule recommends. The effect does internal diffing (`hasChanged`, `timeSinceLastEdit`) to compensate, but this means the effect runs frequently only to no-op most of the time.

**Recommendation:** Consider splitting this into smaller, focused effects or using a content hash as the sole dependency.

**5d. `useCommentPreview` re-sorts and re-filters on every render**

```typescript
const preview = (query.data ?? [])
  .filter(c => !c.parentId)
  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  .slice(0, 2);
```

This runs on every render, not just when `query.data` changes.

**Recommendation:** Wrap in `useMemo` keyed on `query.data`.

**5e. `filteredUsers` computed on every render in AdminDashboard**

```typescript
const filteredUsers = users.filter(
  u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       u.email.toLowerCase().includes(searchQuery.toLowerCase()),
);
```

This runs on every render, not memoized.

**Recommendation:** Wrap in `useMemo` keyed on `[users, searchQuery]`.

**5f. Map page extracts 21 properties from Zustand with `useShallow`**

While `useShallow` prevents unnecessary re-renders, extracting 21 properties from a single store call creates a large destructured object. The setters (which are stable references) don't need `useShallow`.

**Recommendation:** Split into separate selectors: one for state values (needs `useShallow`), one for actions (stable, doesn't need `useShallow`). Zustand actions are referentially stable and never cause re-renders.

**5g. No `React.memo` usage anywhere**

The codebase has zero `React.memo` wrappers. For frequently re-rendered list items (note cards, comment items), `memo` could prevent unnecessary re-renders when parent state changes.

**Recommendation:** Consider `memo` for:
- `ClickableNote` / `EnhancedClickableNote` (rendered in lists)
- `StatsCard` (re-renders when any admin state changes)
- `UserOption` in stories page (rendered in dropdowns)

#### Pros
- `useShallow` used properly for Zustand store access
- Derived state via `useMemo` in map page
- `useRef` for handlers avoids dependency issues in `useNoteSync`

#### Cons
- 13-dependency effect in `useNoteSync` fires too often
- Missing `useMemo` for filtered/sorted data in several components
- No `React.memo` for list item components
- Zustand store destructuring mixes state and actions

---

### 6. Rendering Performance (MEDIUM)

#### Issues Found

**6a. No `content-visibility` for long lists**

The map's notes panel and stories grid render potentially hundreds of items without `content-visibility: auto`. For off-screen note cards, this CSS property would skip rendering entirely.

**Recommendation:** Add `content-visibility: auto` and `contain-intrinsic-size` to note card containers in the map panel and stories grid.

**6b. Suspense only used for `useSearchParams` workaround**

The 3 Suspense boundaries found are all boilerplate wrappers for `useSearchParams()` (required by Next.js). No strategic Suspense boundaries exist for data streaming.

**Recommendation:** Add Suspense boundaries around data-dependent sections if Server Components are adopted.

**6c. Inline anonymous functions in JSX**

Several components create new function references on each render:
- `map/page.tsx` lines 287-294: `onZoomIn` and `onZoomOut` are inline arrow functions
- `map/page.tsx` line 339: `onTogglePanel` is inline
- `AdminDashboard.tsx` line 329: `onChange` handler

For components that receive these as props, this defeats shallow comparison.

**Recommendation:** For the zoom handlers, extract to `useCallback` or move to a parent function.

**6d. Conditional rendering uses correct ternary pattern -- GOOD**

The codebase consistently uses ternary operators for conditional rendering (e.g., `isLoading ? <Skeleton /> : <Content />`), avoiding the `&&` pitfall where `0 && <Component />` renders `0`.

#### Pros
- Correct ternary conditional rendering throughout
- Clean component composition in map page

#### Cons
- No `content-visibility` for long scrollable lists
- No strategic Suspense boundaries for data streaming
- Inline functions in JSX prevent shallow comparison optimization

---

### 7. JavaScript Performance (LOW-MEDIUM)

#### Issues Found

**7a. `useGlobalMapNotes` and `usePersonalMapNotes` call `.reverse()` on arrays**

```typescript
// useNotes.ts line 53
const data = await notesService.fetchPublished();
return data.reverse().filter(note => note.published === true);
```

`.reverse()` mutates the original array. While this is inside a query function (so the source array is fresh), using `.toReversed()` would be safer and clearer.

**Recommendation:** Replace `.reverse()` with `.toReversed()` for immutability.

**7b. `useCommentPreview` creates `Date` objects in sort comparator**

```typescript
.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
```

This creates 2 Date objects per comparison. For small arrays (preview is sliced to 2), this is negligible. No action needed.

**7c. JSON.stringify used for deep comparison in `useNoteSync`**

```typescript
if (JSON.stringify(storeNote.tags) !== JSON.stringify(tags)) { ... }
if (JSON.stringify(storeImages) !== JSON.stringify(images)) { ... }
```

Multiple `JSON.stringify` calls per effect run. For the current data sizes, this is acceptable, but a shallow array comparison would be more efficient.

**7d. `uniqueCreatorIds` in stories page uses Set correctly -- GOOD**

```typescript
const creators = new Set<string>();
data.pages.flatMap(page => page.data).forEach(note => {
  if (note.creator) creators.add(note.creator);
});
return Array.from(creators);
```

Using `Set` for deduplication is the recommended O(1) lookup pattern.

#### Pros
- `Set` used for deduplication
- Clean early returns in most functions
- No unnecessary RegExp creation in loops

#### Cons
- `.reverse()` instead of `.toReversed()` (mutation risk)
- Heavy use of `JSON.stringify` for comparison (acceptable for current scale)

---

### 8. Advanced Patterns (LOW)

#### Issues Found

**8a. QueryClient lazy initialization -- GOOD**

```typescript
const [queryClient] = useState(() => new QueryClient({...}));
```

This correctly initializes the QueryClient once using lazy state initialization, preventing re-creation on every render.

**8b. `useRef` for handler stability -- GOOD**

`useNoteSync.ts` stores `noteHandlers` in a ref to avoid dependency issues:
```typescript
const noteHandlersRef = useRef(noteHandlers);
noteHandlersRef.current = noteHandlers;
```

This is a valid pattern for keeping refs in sync without adding to effect dependencies.

**8c. Auth store `initialize()` has init-once guard -- GOOD**

```typescript
initialize: () => {
  if (get().isInitialized) return;
  // ...
}
```

This prevents double-initialization, following the "initialize once per app load" pattern.

#### Pros
- Lazy state initialization for QueryClient
- Ref-based handler stability pattern
- Init-once guard in auth store

#### Cons
- No issues identified in this category

---

## Strengths Summary

1. **TanStack Query architecture** -- Query key factories, optimistic updates, cache sharing, and sensible defaults demonstrate strong data fetching patterns.

2. **Zustand with `useShallow`** -- Proper shallow comparison prevents unnecessary re-renders from store subscriptions.

3. **Component decomposition** -- The NoteEditor is well-decomposed into sub-components with colocated hooks (useAutoSave, useNoteSync, useCommentBubble).

4. **Infinite scroll** -- Clean implementation using IntersectionObserver with proper cleanup.

5. **Service layer separation** -- Clean `fetchWithAuth` abstraction with typed service functions.

6. **Admin page RSC pattern** -- Server-side data fetching with client component hydration.

---

## Recommendations Summary

| # | Recommendation | Impact | Effort | Rule |
|---|---------------|--------|--------|------|
| 1 | Add `next/dynamic` for Google Maps, Tiptap editor, MUI | CRITICAL | Medium | `bundle-dynamic-imports` |
| 2 | Move Emotion cache provider out of root layout | HIGH | Low | `bundle-defer-third-party` |
| 3 | Eliminate barrel file imports or add `optimizePackageImports` | HIGH | Medium | `bundle-barrel-imports` |
| 4 | Convert `notes/[id]/page.tsx` to use Server Component + TanStack Query | HIGH | Medium | `server-parallel-fetching` |
| 5 | Add localStorage versioning to Zustand persist | MEDIUM | Low | `client-localstorage-schema` |
| 6 | Split `useNoteSync` mega-effect into focused effects | MEDIUM | Medium | `rerender-dependencies` |
| 7 | Add `useMemo` for filtered lists (admin users, comment preview) | MEDIUM | Low | `rerender-memo` |
| 8 | Add `content-visibility: auto` to note card lists | MEDIUM | Low | `rendering-content-visibility` |
| 9 | Separate Zustand actions from state in selectors | LOW | Low | `rerender-defer-reads` |
| 10 | Replace `.reverse()` with `.toReversed()` | LOW | Low | `js-tosorted-immutable` |
| 11 | Add `React.memo` to list item components | LOW | Low | `rerender-memo` |
| 12 | Extract inline zoom/toggle handlers to `useCallback` | LOW | Low | `rerender-functional-setstate` |

---

## Priority Action Items

### Immediate (High Impact, Low Effort)

1. **Move Emotion provider** -- Scope `NextAppDirEmotionCacheProvider` to only the editor route instead of wrapping the entire app.

2. **Add `optimizePackageImports`** to `next.config.js`:
   ```js
   experimental: {
     optimizePackageImports: [
       '@/app/lib/services',
       '@/app/lib/components/NoteEditor',
     ]
   }
   ```

3. **Add Zustand persist versioning:**
   ```typescript
   persist(store, {
     name: 'auth-store',
     version: 1,
     migrate: (persisted, version) => { /* handle migrations */ },
   })
   ```

### Short-term (High Impact, Medium Effort)

4. **Dynamic import Google Maps and Tiptap editor** using `next/dynamic` with `{ ssr: false }`.

5. **Convert note detail page** (`notes/[id]/page.tsx`) from manual `useEffect` fetching to either:
   - A Server Component that fetches and passes data to a client component
   - TanStack Query hooks (matching the rest of the app)

### Long-term (Architecture)

6. **Evaluate Server Component adoption** for data-heavy pages (stories, note detail) to improve SEO, reduce client JS, and enable streaming.

7. **Refactor `useNoteSync`** to use a content hash dependency instead of 13 individual dependencies.
