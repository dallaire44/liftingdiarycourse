# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 application with TypeScript, using the App Router architecture and Tailwind CSS 4 for styling. The project appears to be a lifting diary course application bootstrapped with `create-next-app`.

## Code Generation Guidelines

**CRITICAL**: When generating ANY code, Claude Code MUST ALWAYS first refer to the relevant documentation files within the `/docs` directory:

- /docs/ui.md
- /docs/formatting.md
- /docs/data-fetching.md
- /docs/auth.md
- /docs/data-mutations.md
- /docs/server-components.md

This ensures:

- Consistency with project standards and patterns
- Adherence to established conventions and best practices
- Proper implementation of features according to project specifications
- Avoidance of reinventing solutions that are already documented

Before writing code for any feature, component, or functionality:
1. Check the `/docs` directory for relevant documentation
2. Read and understand the documented approach
3. Follow the patterns and guidelines specified in the docs
4. Only proceed with code generation after consulting the appropriate documentation

## Development Commands

```bash
# Start development server (runs on http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Tech Stack

- **Framework**: Next.js 16.0.10 with App Router
- **Runtime**: React 19.2.1
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 with PostCSS
- **Fonts**: Geist Sans and Geist Mono (via next/font)

## Project Structure

- `src/app/`: App Router directory
  - `layout.tsx`: Root layout with font configuration and metadata
  - `page.tsx`: Home page component
  - `globals.css`: Global styles with Tailwind imports and CSS variables
- `next.config.ts`: Next.js configuration
- `tsconfig.json`: TypeScript configuration with `@/*` path alias pointing to `src/*`
- `eslint.config.mjs`: ESLint configuration using Next.js recommended rules
- `postcss.config.mjs`: PostCSS configuration for Tailwind CSS 4

## Styling Architecture

- Uses Tailwind CSS 4's new `@import "tailwindcss"` syntax (not the traditional `@tailwind` directives)
- CSS variables defined in `globals.css` for theming (`--background`, `--foreground`)
- Supports dark mode via `prefers-color-scheme` media query
- Custom theme tokens using `@theme inline` directive for Tailwind integration
- Geist Sans and Geist Mono fonts are loaded via `next/font/google` and exposed as CSS variables

## TypeScript Configuration

- Path alias `@/*` maps to `./src/*` for cleaner imports
- Strict mode enabled
- Target: ES2017
- JSX mode: react-jsx (React 19's automatic JSX transform)

## Linting

- ESLint configured with Next.js TypeScript and Core Web Vitals presets
- Global ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`
