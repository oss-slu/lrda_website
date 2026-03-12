# Tailwind v3 -> v4 Migration Plan

## Phase 0: Prep

1. Create branch `tailwind-v4-migration`
2. Clean up dead CSS in globals.css:
   - Remove `.card-container` (uses non-existent `@tailwindcss/aspect-ratio` plugin classes)
   - Remove `.line-clamp-2` / `.line-clamp-3` (native in Tailwind v3.3+)
   - Remove likely unused `.container-mobile`, `.btn-touch`, `.safe-*` utilities (verify zero TSX usage)
3. Screenshot key pages for visual regression comparison (welcome, map, notes, admin)

## Phase 1: Dependencies

Update `packages/web/package.json`:

**Remove:**

- `tailwindcss` (v3)
- `autoprefixer`
- `postcss-import`
- `postcss-nesting`
- `postcss-preset-env`
- `tailwindcss-animate`

**Add:**

- `tailwindcss` (v4, `^4.1.0`)
- `@tailwindcss/postcss`
- `tw-animate-css` (CSS-only replacement for tailwindcss-animate)

**Keep as-is:**

- `tailwind-merge` v3.3.1 (already v4-compatible)
- `class-variance-authority`

Then run the automated upgrade tool:

```bash
cd packages/web && npx @tailwindcss/upgrade
```

This handles ~80% of mechanical changes: class renames in TSX files, config migration attempt, directive updates.

## Phase 2: PostCSS Config

Rewrite `postcss.config.js` from 5 plugins to one:

```js
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

Tailwind v4 natively handles imports, nesting, and vendor prefixing via Lightning CSS.

## Phase 3: Configuration -> CSS

### 3.1: Delete `tailwind.config.js`

All configuration moves into `globals.css` via `@theme`.

### 3.2: Update CSS imports

Replace:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

With:

```css
@import 'tailwindcss';
@import 'tw-animate-css';
```

### 3.3: CSS variable color migration (biggest change)

Currently, `:root` stores raw HSL channels and `tailwind.config.js` wraps them:

```css
/* globals.css */
:root {
  --primary: 217.2 91.2% 59.8%;
}

/* tailwind.config.js */
primary: {
  default: 'hsl(var(--primary))';
}
```

In v4, wrap `hsl()` into the variable definitions and register with `@theme inline`:

```css
:root {
  --background: hsl(0 0% 100%);
  --foreground: hsl(222.2 84% 4.9%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(222.2 84% 4.9%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(222.2 84% 4.9%);
  --primary: hsl(217.2 91.2% 59.8%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(210 40% 96.1%);
  --secondary-foreground: hsl(222.2 47.4% 11.2%);
  --muted: hsl(210 40% 96.1%);
  --muted-foreground: hsl(215.4 16.3% 46.9%);
  --accent: hsl(210 40% 96.1%);
  --accent-foreground: hsl(222.2 47.4% 11.2%);
  --destructive: hsl(0 84.2% 60.2%);
  --destructive-foreground: hsl(210 40% 98%);
  --border: hsl(214.3 31.8% 91.4%);
  --input: hsl(214.3 31.8% 91.4%);
  --ring: hsl(217.2 91.2% 59.8%);
  --radius: 0.5rem;
}

.dark {
  --background: hsl(222.2 84% 4.9%);
  --foreground: hsl(210 40% 98%);
  /* ... all dark mode variables similarly wrapped in hsl() ... */
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);
}
```

### 3.4: Migrate custom keyframes and animations

Accordion keyframes are provided by `tw-animate-css` out of the box. Custom ones move to `@theme`:

```css
@theme {
  --animate-fadeIn: fadeIn 1s ease-in forwards;
  --animate-zoom-slow: zoomIn 10s ease-in-out infinite alternate;
}

@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes zoomIn {
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(1.1);
  }
}
```

### 3.5: Dark mode

`darkMode: ['class']` is the default in v4. No config needed -- just keep the `.dark` CSS variable block.

## Phase 4: Custom CSS in globals.css

### 4.1: Convert `@layer utilities` to `@utility` directives

```css
/* Old */
@layer utilities {
  .container-mobile {
    @apply w-full px-4 sm:px-6 lg:px-8;
  }
}

/* New */
@utility container-mobile {
  width: 100%;
  padding-left: 1rem;
  padding-right: 1rem;
  @media (min-width: 640px) {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
  @media (min-width: 1024px) {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}
```

If these utilities have zero TSX usage, just delete them entirely.

### 4.2: Convert `@layer base` blocks

Remove `@layer base` wrapping -- use plain CSS. Replace `@apply` with equivalent properties:

```css
/* Old */
@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* New */
* {
  border-color: var(--border);
}
body {
  background-color: var(--background);
  color: var(--foreground);
}
```

### 4.3: `.text-gradient` utility

Convert to `@utility` directive or replace with `text-transparent` class directly where used:

```css
@utility text-gradient {
  color: transparent;
}
```

### 4.4: Plain CSS blocks (no changes needed)

These are pure CSS and stay as-is:

- `.tiptap` styles
- `.rhap_*` audio player styles (~260 lines)
- `.custom-marker-label`, `.clickable-note`, `.popup-*` styles
- `#map`, `html,body` resets
- `.scroll-shadow`, custom `@keyframes`, `.custom-marker`, `.note-content img`

The `.rhap_*` styles referencing `var(--primary)` / `var(--secondary)` will get the hsl()-wrapped value automatically from the updated variable definitions.

## Phase 5: introjs-custom.css

Replace ~30 occurrences of `hsl(var(--...))` with `var(--...)`:

```css
/* Old */
background: hsl(var(--card)) !important;

/* New */
background: var(--card) !important;
```

For opacity patterns:

```css
/* Old */
background: hsl(var(--muted-foreground) / 0.5);

/* New */
background: color-mix(in srgb, var(--muted-foreground) 50%, transparent);
```

## Phase 6: TSX Component Updates

Mostly handled by the upgrade tool:

| Pattern         | Replacement          | Count     |
| --------------- | -------------------- | --------- |
| `flex-shrink-0` | `shrink-0`           | ~19 files |
| `bg-opacity-*`  | `bg-black/70` syntax | 2 files   |

Ring utilities already use explicit widths (`ring-1`, `ring-2`), no issues with v4's changed default.

`ring-offset-background` (used in ~17 files) continues to work since `background` is registered in `@theme inline`.

## Phase 7: shadcn/ui Components (optional)

1. Update `components.json` to remove `tailwind.config` reference
2. Optionally re-generate components from shadcn CLI for v4 versions
   - Be careful with customized components (`button.tsx` has custom hover colors, etc.)
   - Priority: `dialog.tsx`, `alert-dialog.tsx`, `sheet.tsx`, `dropdown-menu.tsx` (heavy animation usage)
   - Animation classes from `tw-animate-css` use the same names as `tailwindcss-animate`

## Phase 8: Verify

1. `pnpm --filter web build` -- fix any build errors
2. Visual regression check against Phase 0 screenshots
3. `pnpm --filter web test:unit` / `pnpm --filter web test:e2e`
4. `pnpm --filter web preview` -- Cloudflare Workers/OpenNext build

---

## Files Changed Summary

| File                                  | Action                                                  |
| ------------------------------------- | ------------------------------------------------------- |
| `packages/web/package.json`           | Update/remove deps                                      |
| `packages/web/postcss.config.js`      | Simplify to 1 plugin                                    |
| `packages/web/tailwind.config.js`     | **Delete**                                              |
| `packages/web/app/globals.css`        | Major rewrite (imports, @theme, @utility, hsl wrapping) |
| `packages/web/app/introjs-custom.css` | ~30 `hsl(var(...))` -> `var(...)`                       |
| `packages/web/components.json`        | Remove config reference                                 |
| `~19 TSX files`                       | Class renames (mostly automated)                        |
| `29 shadcn components`                | Optional re-generation                                  |

## Risk Assessment

| Area                                      | Risk       | Notes                                                                                                     |
| ----------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| CSS variable color system                 | **Medium** | Must update globals.css AND introjs-custom.css in lockstep; missed `hsl(var(...))` causes double-wrapping |
| `@layer` to `@utility` migration          | **Medium** | Custom utility definitions need careful conversion                                                        |
| Dependency updates                        | Low        | Straightforward swap                                                                                      |
| PostCSS simplification                    | Low        | Drop-in replacement                                                                                       |
| `tailwindcss-animate` -> `tw-animate-css` | Low        | Same class API, CSS import instead of JS plugin                                                           |
| `tailwind-merge`                          | Low        | v3.3.1 already compatible                                                                                 |
| TSX class renames                         | Low        | Automated by upgrade tool                                                                                 |
