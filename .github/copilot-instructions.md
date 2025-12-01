# GitHub Copilot Instructions

## Project Overview

This is the **Where's Religion?** desktop web application - a Next.js project for documenting and mapping lived religion research. The app uses Firebase for authentication and data, Google Maps for mapping, and supports rich text editing with media uploads.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix primitives), MUI (Material UI)
- **Rich Text Editor**: Tiptap with mui-tiptap
- **State Management**: Zustand
- **Backend**: Firebase (Auth, Firestore), S3 for media storage
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
- Component files go in `app/lib/components/` or `components/ui/` (shadcn).
- Utility functions go in `app/lib/utils/`.
- Data models go in `app/lib/models/`.
- Zustand stores go in `app/lib/stores/`.
- Page components go in `app/lib/pages/`.

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
