# Agent Guidelines for Cookbook

## Commands

- **Build**: `npm run build`
- **Lint**: `npm run lint` (fix: `npm run check`)
- **Test**: `npm test` (uses vitest)
- **Dev**: `npm run dev` (runs on port 3000)

## Code Style

- **Formatting**: Prettier with no semicolons, single quotes, trailing commas
- **Imports**: Use `@/*` path aliases for src imports (e.g., `import { db } from '@/db'`)
- **TypeScript**: Strict mode enabled, no unused locals/parameters
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **Error Handling**: Try-catch with explicit error types, return success/error objects
- **React**: Functional components with hooks, React 19 syntax

## Shadcn Components

Install new Shadcn components with: `pnpx shadcn@latest add <component>`

## Stack

TanStack Start (React Router + SSR), TanStack Query, TanStack Form, Drizzle ORM, Tailwind CSS, Vite
