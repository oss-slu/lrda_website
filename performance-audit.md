# Performance Audit -- Where's Religion? Web App

**Date:** 2026-03-10
**Scope:** `packages/web/` -- React 19.2 / Next.js 16 / Cloudflare Workers
**Methodology:** Vercel React Best Practices skill (58 rules, 8 categories) applied against full codebase exploration

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| DONE | Already fixed in this branch |
| -- | Not yet addressed |

---

## 1. Eliminating Waterfalls (CRITICAL)

### 1.1 Note Detail Page -- Sequential Fetches

| | |
|---|---|
| **File** | `app/notes/[id]/page.tsx:63-90` |
| **Status** | -- |
| **Current** | `fetchById(noteId).then(note => fetchCreatorName(note.creator).then(...))` -- creator fetch waits for note fetch |
| **Recommended** | Convert to Server Component that fetches note server-side; use `useCreatorName` hook (already exists) for creator in a client island |
| **Pros** | Eliminates waterfall entirely; note data streams immediately; better SEO |
| **Cons** | Requires page restructure (server + client split); `useCreatorName` hook already handles caching so migration is straightforward |
| **Effort** | Medium |

### 1.2 StoriesCardPreview / StoryDetailDialog -- Parallel Creator + Location Fetches

| | |
|---|---|
| **Files** | `app/lib/components/stories/StoriesCardPreview.tsx:102-124`, `StoryDetailDialog.tsx:65-87` |
| **Status** | -- |
| **Current** | Two separate `useEffect` hooks: one fetches creator, one fetches location. They run independently but could race or sequence unexpectedly |
| **Recommended** | Use `useCreatorName` hook (already exists) instead of manual `fetchCreatorName` in effects. Create a `useLocationName` query hook for location caching |
| **Pros** | Deduplicates creator fetching logic; React Query handles caching/dedup; eliminates manual state management |
| **Cons** | Adds a new hook (`useLocationName`); minor refactor across 3-4 components |
| **Effort** | Low-Medium |

### 1.3 click_note_card.tsx -- Manual Fetch Instead of Query Hook

| | |
|---|---|
| **File** | `app/lib/components/click_note_card.tsx:63-77` |
| **Status** | -- |
| **Current** | Uses `useEffect` + `fetchCreatorName` + `setState` manually |
| **Recommended** | Replace with `useCreatorName(note.creator)` hook (already used in `note_card.tsx`) |
| **Pros** | Removes boilerplate; leverages React Query cache (likely already warm from NoteCard) |
| **Cons** | None -- direct drop-in replacement |
| **Effort** | Low |

### 1.4 Auth Store -- Sequential Session + Profile Fetch

| | |
|---|---|
| **File** | `app/lib/stores/authStore.ts:122-150` |
| **Status** | -- |
| **Current** | `getCurrentSession().then(async resp => { const profile = await fetchMe(); ... })` |
| **Recommended** | `Promise.all([getCurrentSession(), fetchMe().catch(() => null)])` |
| **Pros** | Shaves ~100-300ms off initial auth resolution; profile starts loading immediately |
| **Cons** | `fetchMe()` may fail if no session exists (wasted request); mitigated by `.catch(() => null)` |
| **Effort** | Low |

### 1.5 Missing Suspense Boundaries for Streaming

| | |
|---|---|
| **Files** | `app/admin/page.tsx`, `app/notes/[id]/page.tsx` |
| **Status** | -- |
| **Current** | Admin page does `Promise.all` server-side but returns all-or-nothing. Note detail is fully client-rendered |
| **Recommended** | Split admin into `<Suspense fallback={<StatsSkeleton/>}><AdminStats/></Suspense>` + `<Suspense fallback={<TableSkeleton/>}><AdminUsers/></Suspense>` for independent streaming |
| **Pros** | Stats appear as soon as that fetch completes; users table streams independently |
| **Cons** | More components to manage; admin page is low-traffic so ROI is limited |
| **Effort** | Medium |

---

## 2. Bundle Size Optimization (CRITICAL)

### 2.1 Global intro.js CSS in Root Layout

| | |
|---|---|
| **File** | `app/layout.tsx` |
| **Status** | -- |
| **Current** | `import 'intro.js/introjs.css'` and `import './introjs-custom.css'` loaded globally, but intro.js only used on map + notes editor pages |
| **Recommended** | Move CSS import into the components that use intro.js (`useMapIntro.ts`, `useIntroTour.ts`) via dynamic import or scoped import |
| **Pros** | Saves ~5-10 KB from global CSS bundle; every page loads faster |
| **Cons** | May cause brief FOUC on first intro.js trigger if CSS loads lazily; mitigated by preloading on hover |
| **Effort** | Low |

### 2.2 react-player Imported Eagerly

| | |
|---|---|
| **Files** | `app/lib/components/media_viewer.tsx`, `app/lib/components/compact_carousel.tsx` |
| **Status** | -- |
| **Current** | `import ReactPlayer from 'react-player'` at top level; adds ~40-50 KB |
| **Recommended** | `const ReactPlayer = dynamic(() => import('react-player'), { ssr: false })` or `React.lazy` |
| **Pros** | Video player only loaded when video media exists; saves 40-50 KB for image-only notes |
| **Cons** | Brief loading state when first video renders; negligible UX impact since video needs buffering anyway |
| **Effort** | Low |

### 2.3 docx Library Imported at Top Level

| | |
|---|---|
| **File** | `app/lib/components/NoteEditor/NoteEditorToolbar.tsx` |
| **Status** | -- |
| **Current** | `import { Document, Packer, Paragraph } from 'docx'` at module level; ~20-30 KB |
| **Recommended** | Move to dynamic import inside download handler: `const { Document, Packer, Paragraph } = await import('docx')` (same pattern already used for `jsPDF`) |
| **Pros** | Only loaded when user actually clicks download; saves 20-30 KB from editor bundle |
| **Cons** | ~200ms delay on first DOCX download; acceptable since download is already async |
| **Effort** | Low |

### 2.4 react-h5-audio-player Imported Eagerly

| | |
|---|---|
| **File** | `app/lib/components/NoteEditor/NoteElements/AudioPicker.tsx` |
| **Status** | -- |
| **Current** | `import AudioPlayer from 'react-h5-audio-player'` at top level; ~15-25 KB |
| **Recommended** | `React.lazy(() => import('react-h5-audio-player'))` wrapped in Suspense, only rendered when `audioArray.length > 0` |
| **Pros** | Only loaded for notes with audio; saves 15-25 KB for text/image notes |
| **Cons** | Brief flash when audio player first loads; mitigated by Suspense fallback |
| **Effort** | Low |

### 2.5 ReactQueryDevtools in Production

| | |
|---|---|
| **File** | `app/lib/components/QueryProvider.tsx:44` |
| **Status** | -- |
| **Current** | `<ReactQueryDevtools initialIsOpen={false} />` always rendered |
| **Recommended** | Wrap in `{process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}` or use `next/dynamic` with `ssr: false` |
| **Pros** | Removes devtools bundle from production (~50 KB) |
| **Cons** | None |
| **Effort** | Trivial |

### 2.6 Unnecessary 'use client' on Mostly-Static Pages

| | |
|---|---|
| **Files** | `app/WelcomePage.tsx`, `app/wheres-religion/page.tsx`, `app/resources/page.tsx` |
| **Status** | -- |
| **Current** | Full `'use client'` for pages that are mostly static content with minor animations |
| **Recommended** | Keep page as Server Component; extract only animated/interactive sections into small client islands |
| **Pros** | Server-renders static content; reduces JS shipped to client by 10-20 KB per page |
| **Cons** | Requires splitting components; animation library (`useReveal` hook) needs refactoring |
| **Effort** | Medium |

**Estimated total bundle savings from section 2: 150-250 KB**

---

## 3. Server-Side Performance (HIGH)

### 3.1 notes/[id] Should Be a Server Component

| | |
|---|---|
| **File** | `app/notes/[id]/page.tsx` |
| **Status** | -- |
| **Current** | Fully client-rendered with `'use client'`; fetches note via `useEffect` |
| **Recommended** | Fetch note server-side, pass as prop to client island for interactive features (comments, edit button) |
| **Pros** | Faster TTFB; note content streams immediately; SEO-friendly; enables `generateMetadata` for social sharing |
| **Cons** | Requires splitting page into server wrapper + client interactive sections |
| **Effort** | Medium |

### 3.2 Missing Metadata Exports on All Pages

| | |
|---|---|
| **Files** | All `page.tsx` files |
| **Status** | -- |
| **Current** | No pages export `metadata` or use `generateMetadata` |
| **Recommended** | Add static `metadata` to each page; use `generateMetadata` for dynamic pages like `notes/[id]` |
| **Pros** | SEO; social sharing cards; proper document titles |
| **Cons** | Tedious but straightforward |
| **Effort** | Low (per page) |

### 3.3 Missing loading.tsx for Route Segments

| | |
|---|---|
| **Files** | `app/admin/`, `app/notes/[id]/`, `app/stories/` |
| **Status** | -- |
| **Current** | No `loading.tsx` files; users see blank page during navigation |
| **Recommended** | Add `loading.tsx` with skeleton UI for each async route segment |
| **Pros** | Instant navigation feedback; Suspense boundary created automatically |
| **Cons** | Need to design skeleton layouts; minor effort |
| **Effort** | Low |

### 3.4 No Font Optimization via next/font

| | |
|---|---|
| **File** | `app/layout.tsx` |
| **Status** | -- |
| **Current** | No `next/font` imports detected |
| **Recommended** | Use `next/font/google` or `next/font/local` for self-hosted font files |
| **Pros** | Eliminates font CLS; zero-layout-shift font loading; fonts served from same origin |
| **Cons** | Minor layout change if font metrics differ slightly |
| **Effort** | Low |

---

## 4. Client-Side Data Fetching (MEDIUM-HIGH)

### 4.1 .reverse().filter() Chain in Query Functions

| | |
|---|---|
| **File** | `app/lib/hooks/queries/useNotes.ts:67-76, 90, 108` |
| **Status** | -- |
| **Current** | `data.reverse().filter(note => note.published === true)` -- reverses all items, THEN filters |
| **Recommended** | Filter first, then use `.toReversed()` (ES2023 immutable): `data.filter(n => n.published).toReversed()` |
| **Pros** | Fewer items to reverse; immutable (no accidental mutation); ~2x faster for large datasets |
| **Cons** | `.toReversed()` requires ES2023 target (already supported in all modern browsers and Node 20+) |
| **Effort** | Trivial |

### 4.2 Map Bounds Filter -- Repeated Method Calls

| | |
|---|---|
| **File** | `app/lib/utils/mapUtils.ts:11-24` |
| **Status** | -- |
| **Current** | Calls `sw.lat()`, `sw.lng()`, `ne.lat()`, `ne.lng()` for every note in the filter loop |
| **Recommended** | Cache bounds values before the loop: `const swLat = sw.lat(); const neLat = ne.lat(); ...` |
| **Pros** | Avoids repeated method dispatch; measurable with 500+ notes |
| **Cons** | None -- pure optimization |
| **Effort** | Trivial |

---

## 5. Re-render Optimization (MEDIUM)

### 5.1 StoriesCardPreview Missing React.memo

| | |
|---|---|
| **File** | `app/lib/components/stories/StoriesCardPreview.tsx:84` |
| **Status** | -- |
| **Current** | `export const StoriesCardPreview: React.FC<...> = ({ note, onClick }) => { ... }` |
| **Recommended** | Wrap with `memo`: `export const StoriesCardPreview = memo<StoriesCardPreviewProps>(function StoriesCardPreview(...) { ... })` |
| **Pros** | Prevents re-rendering all story cards when parent state changes (e.g., search filter update) |
| **Cons** | None -- `note` and `onClick` are stable references |
| **Effort** | Trivial |

### 5.2 AuthProvider Store Selectors Without useShallow

| | |
|---|---|
| **File** | `app/lib/components/AuthProvider.tsx:15-16` |
| **Status** | -- |
| **Current** | Two separate `useAuthStore(state => state.x)` calls |
| **Recommended** | Combine with `useShallow`: `useAuthStore(useShallow(s => ({ initialize: s.initialize, isInitialized: s.isInitialized })))` |
| **Pros** | Consistent with rest of codebase; prevents re-renders from unrelated auth state changes |
| **Cons** | None |
| **Effort** | Trivial |

### 5.3 Inline onClick Handlers in MapNotesPanel List

| | |
|---|---|
| **File** | `app/lib/components/map/MapNotesPanel.tsx:148-150` |
| **Status** | -- |
| **Current** | `onMouseEnter={() => onNoteHover(note.id)}` and `onClick={() => onNoteClick(note)}` create new functions per card per render |
| **Recommended** | Use `data-note-id` attributes + single event handler via event delegation, OR accept that `React.memo` on NoteCard already prevents child re-renders |
| **Pros** | Fewer allocations per render cycle |
| **Cons** | Event delegation adds complexity; current approach is fine since the wrapper div isn't memoized -- the bigger win is already captured by `React.memo` on NoteCard and `content-visibility: auto` |
| **Effort** | Low |

### 5.4 Index Keys in .map() Calls

| | |
|---|---|
| **Files** | `note_card.tsx:86` (tags), `StoriesCardPreview.tsx:209` (tags), `media_viewer.tsx:16` (carousel), `home/team_grid.tsx:95,100` (team members), `click_note_card.tsx:98` (tags) |
| **Status** | -- |
| **Current** | `key={index}` throughout |
| **Recommended** | Use stable keys: `key={tag}` for tags (unique strings), `key={media.uuid}` for media, `key={person.name}` for team members |
| **Pros** | Correct React reconciliation; prevents unmount/remount of unchanged items on list reorder |
| **Cons** | Need to verify uniqueness of keys; tags should be unique within a note |
| **Effort** | Low |

### 5.5 JSON.stringify for Equality in TagManager

| | |
|---|---|
| **File** | `app/lib/components/NoteEditor/NoteElements/TagManager.tsx:36` |
| **Status** | -- |
| **Current** | `JSON.stringify(prevTags) !== JSON.stringify(newTags)` inside `setTags` updater |
| **Recommended** | Shallow comparison: check length, then compare `.label` and `.origin` fields |
| **Pros** | Avoids serialization overhead; faster for small arrays |
| **Cons** | Slightly more code; but tags arrays are small so either approach is fast |
| **Effort** | Low |

### 5.6 Sanitized HTML Computed in useEffect Instead of useMemo

| | |
|---|---|
| **Files** | `click_note_card.tsx:73-77`, `InstructorStoriesCard.tsx:67-74` |
| **Status** | -- |
| **Current** | `useEffect(() => { setSanitizedContent(sanitizeHtml(note.text, {...})); }, [note.text])` |
| **Recommended** | `const sanitizedContent = useMemo(() => sanitizeHtml(note.text, {...}), [note.text])` |
| **Pros** | Eliminates extra render cycle (effect runs after render, triggers setState, triggers re-render); computed synchronously during render instead |
| **Cons** | `sanitizeHtml` runs during render -- if it's slow, it blocks paint. In practice, HTML strings are small enough that this is fine |
| **Effort** | Trivial |

---

## 6. Rendering Performance (MEDIUM)

### 6.1 Date Object Creation in List Render

| | |
|---|---|
| **File** | `app/lib/components/note_listview.tsx:79-94` |
| **Status** | -- |
| **Current** | `handleGetTime` creates 2 new `Date` objects per call, called once per visible note in every render |
| **Recommended** | Wrap in `useCallback` (already a function, but not memoized). The "today" date could be computed once per render cycle via `useMemo` |
| **Pros** | Reduces Date allocations; measurable with 100+ visible notes |
| **Cons** | Minor complexity; Date creation is fast |
| **Effort** | Low |

### 6.2 O(n^2) Tag Filtering in TagManager

| | |
|---|---|
| **File** | `app/lib/components/NoteEditor/NoteElements/TagManager.tsx:176-187` |
| **Status** | -- |
| **Current** | `.filter(tag => !tags.find(t => t.label === tag))` -- linear scan per suggested tag |
| **Recommended** | Build a `Set` of existing labels: `const existing = new Set(tags.map(t => t.label))` then `.filter(tag => !existing.has(tag))` |
| **Pros** | O(n) instead of O(n^2); matters when suggested tags list grows |
| **Cons** | Set creation has overhead for very small lists; negligible |
| **Effort** | Trivial |

### 6.3 Animated Blur Elements Without will-change

| | |
|---|---|
| **File** | `app/wheres-religion/page.tsx:20-24` |
| **Status** | -- |
| **Current** | Large `blur-3xl` divs with `animate-pulse` but no GPU hint |
| **Recommended** | Add `will-change-transform` class to promote to GPU layer |
| **Pros** | Smoother animation; avoids main thread layout thrashing |
| **Cons** | Uses more GPU memory; acceptable for 2 decorative elements |
| **Effort** | Trivial |

### 6.4 media_viewer.tsx Uses Raw `<img>` Instead of next/image

| | |
|---|---|
| **File** | `app/lib/components/media_viewer.tsx:20-24` |
| **Status** | -- |
| **Current** | `<img>` tag for image media in carousel |
| **Recommended** | Replace with `next/image` with proper `sizes`, `quality`, and `loading="lazy"` |
| **Pros** | Automatic format conversion (WebP/AVIF); responsive sizing; lazy loading; Cloudflare Images optimization |
| **Cons** | Need to handle dynamic dimensions; may need `fill` prop with aspect ratio container |
| **Effort** | Low |

---

## 7. JavaScript Performance (LOW-MEDIUM)

### 7.1 setTimeout for Infinite Scroll Loading

| | |
|---|---|
| **Files** | `app/lib/hooks/useInfiniteNotes.ts:59-62`, `app/lib/components/note_listview.tsx:46-55` |
| **Status** | -- |
| **Current** | `setTimeout(() => { ... }, 75)` and `setTimeout(() => { ... }, 150)` for load-more batching |
| **Recommended** | Replace with `requestAnimationFrame` for frame-aligned updates; or use `React.startTransition` to mark as non-urgent |
| **Pros** | Aligns with browser paint cycle; avoids arbitrary delays |
| **Cons** | Behavior difference is subtle; setTimeout approach already works |
| **Effort** | Low |

### 7.2 RegExp in Character Loop (Citation Formatter)

| | |
|---|---|
| **File** | `app/lib/utils/citation_formatter.tsx:50-78` |
| **Status** | -- |
| **Current** | `/[A-Z]/.test(citation[i + 2])` called per character in loop |
| **Recommended** | Replace with character comparison: `char >= 'A' && char <= 'Z'` |
| **Pros** | Avoids RegExp engine overhead per iteration |
| **Cons** | Negligible real-world impact; citations are short strings |
| **Effort** | Trivial |

### 7.3 Tag Existence Check Uses .find() Instead of Set

| | |
|---|---|
| **File** | `app/lib/components/NoteEditor/NoteElements/TagManager.tsx:66` |
| **Status** | -- |
| **Current** | `tags.find(t => t.label === trimmed)` for duplicate check |
| **Recommended** | `useMemo(() => new Set(tags.map(t => t.label)), [tags])` then `existingSet.has(trimmed)` |
| **Pros** | O(1) lookup; consistent with Set pattern used elsewhere |
| **Cons** | Overkill for typical tag counts (< 20) |
| **Effort** | Low |

---

## 8. Already Completed (This Branch)

These items were addressed in the current `cloudflare-migration` branch:

| Item | Description | File |
|------|-------------|------|
| DONE | NoteCard wrapped in `React.memo` | `note_card.tsx` |
| DONE | `content-visibility: auto` on map panel cards | `MapNotesPanel.tsx` |
| DONE | `useDeferredValue` for panel list | `map/page.tsx` |
| DONE | Diff-based marker management (no flash) | `useMapMarkers.tsx` |
| DONE | Ref-based callbacks in marker hook | `useMapMarkers.tsx` |
| DONE | `fetchAllPages` pagination for map notes | `useNotes.ts` |
| DONE | `isPanelStale` guard against empty state flash | `map/page.tsx` |
| DONE | Staggered skeleton animations | `MapNotesPanel.tsx` |
| DONE | Fade-in card animations | `MapNotesPanel.tsx` |
| DONE | Stable `handleMouseLeave` via useCallback | `MapNotesPanel.tsx` |
| DONE | Cloudflare Images binding for next/image | `wrangler.jsonc` |
| DONE | next/image quality + remotePatterns config | `next.config.ts` |
| DONE | `optimizePackageImports` in next.config | `next.config.ts` |

---

## Priority Matrix

| Priority | Items | Combined Impact | Combined Effort |
|----------|-------|-----------------|-----------------|
| **P0 -- Do Now** | 2.5 (devtools), 4.1 (reverse/filter), 4.2 (bounds cache), 5.1 (memo StoriesCard), 5.6 (useMemo sanitize), 1.3 (useCreatorName hook) | High | All trivial/low |
| **P1 -- Next Sprint** | 2.1 (intro CSS), 2.2 (react-player), 2.3 (docx), 2.4 (audio player), 3.2 (metadata), 3.3 (loading.tsx), 5.4 (stable keys) | High | All low |
| **P2 -- Worth Doing** | 1.1 (note detail SSR), 1.2 (creator/location hooks), 3.1 (note page SSR), 1.4 (auth parallel), 6.4 (media_viewer next/image) | Medium-High | Medium |
| **P3 -- Nice to Have** | 2.6 (client boundaries), 3.4 (next/font), 5.2 (AuthProvider), 5.3 (event delegation), 5.5 (JSON.stringify), 6.1-6.3, 7.1-7.3 | Low-Medium | Varies |
| **P4 -- Low ROI** | 1.5 (admin Suspense), 7.2 (regex in citation) | Low | Medium |

---

## Quick Wins Checklist

These can each be done in under 5 minutes:

- [ ] 2.5 -- Conditional ReactQueryDevtools render
- [ ] 4.1 -- `.filter().toReversed()` in useNotes.ts (3 locations)
- [ ] 4.2 -- Cache bounds values in `filterNotesByMapBounds`
- [ ] 5.1 -- Wrap StoriesCardPreview in `React.memo`
- [ ] 5.2 -- Add `useShallow` to AuthProvider selectors
- [ ] 5.6 -- Replace `useEffect` + `setState` with `useMemo` for sanitized HTML (2 files)
- [ ] 1.3 -- Replace manual `fetchCreatorName` effect with `useCreatorName` hook in click_note_card
- [ ] 6.3 -- Add `will-change-transform` to blur elements
