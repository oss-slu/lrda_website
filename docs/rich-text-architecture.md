# Rich-Text Note Architecture

Status: shipped. Pattern B is the live architecture. The interim Pattern A fix
(sanitize-html + dangerouslySetInnerHTML + path-browserify alias) has been
fully removed.

## Background

Notes are authored with TipTap v3 (ProseMirror). Today the editor emits an HTML
string (`editor.getHTML()`) which is stored in a `text` column and rendered with
`dangerouslySetInnerHTML` after passing through a runtime sanitizer
(`sanitize-html`).

This storage choice (persisting open-ended HTML) is the root of a recurring set
of problems:

- The renderer must sanitize attacker-influenceable HTML at runtime in every
  environment. `sanitize-html` pulls in node's `path` (via postcss), which the
  browser bundle does not have, so it breaks client-side. Cloudflare Workers SSR
  only works because `nodejs_compat` is enabled.
- String-based sanitizers cannot fully neutralize mutation-XSS (mXSS); only a
  real DOM (DOMPurify) can, and Workers has no DOM.
- The editor loads note text from the same data path the display uses, so any
  sanitize-on-read would cause lossy edit round-trips.
- `dangerouslySetInnerHTML` is the dangerous primitive at the center of it all.

## End-state UX goals

Authoring

- Reliable WYSIWYG: headings, lists, tables, links, emphasis, highlight, etc.
- Zero data loss: reopening and re-saving never silently degrades content.
- Native-feeling media handling (model TBD; see open questions).

Viewing

- A note renders identically across all surfaces: the map pin modal, the stories
  grid + story modal, and the full note page.
- Fast to open, no flash of loading content on common paths.

Sharing and discovery

- Published notes have real, shareable URLs.
- Pasting a published note URL produces a proper social preview card
  (title + description + image).
- Search engines can index published notes (server-rendered content).

Safety

- One user's content can never attack another reader. This is a structural
  guarantee, not a best-effort filter.

Consistency over time

- The stored form is the note's true form; every viewer, the social card, and
  the search description are projections of that one source and never drift.

## Target architecture (Pattern B: store the structured document)

Principles:

1. One canonical representation of content -- the editor's structured
   ProseMirror document (`getJSON()`) -- is the single source of truth. Every
   viewer, the social card, and the SEO description are projections of it.
2. Safety comes from the representation, not from cleanup. Content is a
   constrained document whose schema defines exactly which nodes/marks may
   exist, so unsafe content is unrepresentable rather than filtered. The only
   remaining attack surface is URL-bearing attributes (link `href`, image
   `src`), validated with a small scheme allowlist (pure JS, isomorphic).
3. One shared renderer used by all viewing surfaces (consistency by
   construction, single place to evolve styling).
4. Public surfaces are server-rendered; interactive surfaces are client-rendered.
   Published note pages and the stories list SSR for SEO + first paint + social
   cards; map and admin stay client-side.
5. Social cards are derived per note at render time (title, description projected
   from content, image from the note's media).

What this eliminates: the runtime HTML sanitizer, the `path` polyfill, the
isomorphic sanitization problem, the mXSS class of bugs, lossy editor
round-trips, and `dangerouslySetInnerHTML`.

Why we are well-positioned: the editor is already TipTap/ProseMirror (built for
this), and mobile is being rewritten against this same API, so no legacy
consumer forces an HTML contract.

### High-level implementation notes

- Storage: persist `getJSON()` (jsonb column, or the existing text column holding
  JSON during transition). Keep raw -- never sanitize the stored form.
- Rendering: `@tiptap/static-renderer` walks JSON and emits React elements (no
  DOM, no `dangerouslySetInnerHTML`). Works identically on Workers SSR, browser
  hydration, and Node. A single `<NoteContent json=... />` component wraps it.
- Editor: save `getJSON()`, load JSON via `setContent(json)`. Lossless.
- URL safety: configure scheme allowlist at the schema level (TipTap Link
  `isAllowedUri`, image src validation).
- SEO description: pure walk over text nodes (no regex-on-HTML).
- Migration: one-time offline backfill converting existing HTML -> JSON via
  `generateJSON(html, extensions)` (runs in Node with a DOM, not on Workers).
  Requires a dry-run diff and corpus audit first; legacy HTML that does not map
  to the schema is coerced or dropped and must be reviewed.

## Decisions

- Visibility: only published notes (stories) are public and shareable/indexable.
  Other notes require auth.
- Social card: title + description + image (note's first image).
- Media model: undecided -- the note.text audit decides whether inline embeds
  (images/audio/video mixed into prose) already exist in the corpus, or whether
  media is purely separate attachments (current `note.media`/`note.audio` arrays
  + popovers).

## Resolved prerequisites

1. Corpus audit: all 763 production notes converted with zero failures via
   `generateJSON(html, extensions)` using happy-dom. No unexpected tags.
2. Schema: matches the installed TipTap extensions (see `use_extensions.ts`).
3. Renderer spike: `@tiptap/static-renderer` SSRs on Workers and hydrates
   without mismatch (validated on spike branch, then shipped).
4. Migration: one-time backfill script at `packages/web/scripts/backfill-text-json.ts`
   was run against both local and production databases.
