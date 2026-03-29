# Code Style

Coding conventions and style guidelines for the project.

## TypeScript

- **Strict mode** is enabled across all packages
- Avoid `any` type -- use proper type annotations
- Use modern ES6+ syntax and features
- Define interfaces for component props and data structures
- Use type inference where the type is obvious

## Styling

- **Tailwind CSS** for all styling -- avoid inline styles
- Follow the project color palette (blues and whites)
- Mobile-first responsive design using Tailwind breakpoints
- Customize in `tailwind.config.ts` if needed

## Components

- Functional components with hooks
- **shadcn/ui** is the primary UI library (Radix primitives)
- MUI is used sparingly, only for the rich text editor
- **Lucide React** for icons -- never use emojis as icons

## No Emojis

Do not use emojis in code, comments, documentation, or commit messages. This is a strict project rule.

## File Naming

| Type | Convention | Example |
| --- | --- | --- |
| Components | PascalCase | `NoteEditor.tsx` |
| Utilities | camelCase | `noteStatus.ts` |
| Stores | camelCase | `noteStore.ts` |
| Constants | camelCase or UPPER_SNAKE_CASE | `apiRoutes.ts` |

## Imports

- Use the `@/` alias for imports from the package root
- Avoid deep relative paths like `../../../`

```typescript
// Preferred
import { Button } from '@/components/ui/button'
import { useNoteStore } from '@/app/lib/stores/noteStore'

// Avoid
import { Button } from '../../../components/ui/button'
```

## Linting and Formatting

```bash
pnpm lint       # Run ESLint
pnpm lint:fix   # ESLint with auto-fix
pnpm format     # Prettier formatting
```

ESLint is configured with the TanStack config, TanStack Router plugin, and React Hooks rules.
