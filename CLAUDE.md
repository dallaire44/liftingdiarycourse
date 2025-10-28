# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Lifting Diary Course** application built with Next.js 16, React 19, TypeScript, and Tailwind CSS v4. The project uses the modern Next.js App Router architecture and follows current best practices for React Server Components.

## Code Generation Guidelines

**CRITICAL**: Before generating ANY code, Claude Code MUST:

1. **Always check the `/docs` directory first** for relevant documentation files
2. Read and follow the specifications, patterns, and best practices documented in those files
3. Ensure generated code aligns with the documented architecture and standards
4. Reference the appropriate documentation file(s) when explaining implementation decisions

The `/docs` directory contains authoritative specifications for this project. Never generate code without first consulting the relevant documentation.

- /docs/ui.md
- /docs/data-fetching.md (CRITICAL for all data access and security)

## Development Commands

### Running the Development Server
```bash
npm run dev
```
Starts the Next.js development server at http://localhost:3000 with hot reload enabled.

### Building for Production
```bash
npm run build
```
Creates an optimized production build.

### Starting Production Server
```bash
npm run start
```
Runs the production server (requires `npm run build` first).

### Linting
```bash
npm run lint
```
Runs ESLint to check code quality and adherence to Next.js standards.



## Architecture

### Tech Stack
- **Framework**: Next.js 16 with App Router (RSC architecture)
- **React**: Version 19.2.0
- **TypeScript**: Version 5.x with strict mode enabled
- **Styling**: Tailwind CSS v4 (PostCSS-based, not JIT)
- **Fonts**: Geist Sans and Geist Mono (optimized via next/font)

### Project Structure

```
liftingdiarycourse/
├── src/
│   └── app/              # App Router directory
│       ├── layout.tsx    # Root layout with font configuration
│       ├── page.tsx      # Home page (Server Component by default)
│       ├── globals.css   # Global styles with Tailwind v4 import
│       └── favicon.ico
├── public/               # Static assets (served from root)
├── next.config.ts        # Next.js configuration
├── tsconfig.json         # TypeScript configuration
├── eslint.config.mjs     # ESLint configuration (flat config)
└── postcss.config.mjs    # PostCSS with Tailwind v4 plugin
```

### Key Architecture Details

#### App Router (React Server Components)
- All components in `src/app/` are **Server Components by default**
- To create a Client Component, add `"use client"` directive at the top
- Server Components can directly access backend resources (databases, files, etc.)
- Client Components are needed for interactivity (useState, useEffect, event handlers)

#### Path Aliases
TypeScript is configured with `@/*` alias pointing to `./src/*`:
```typescript
import Component from "@/app/components/MyComponent"
```

#### Styling with Tailwind v4
- Uses new PostCSS-based architecture (not the previous JIT compiler)
- Custom CSS variables defined in `globals.css` using `@theme inline` directive
- Dark mode support via `prefers-color-scheme` media query
- Geist fonts configured as CSS variables via `next/font`

#### TypeScript Configuration
- **Strict mode enabled**: All type checks are enforced
- **Target**: ES2017
- **JSX**: react-jsx (new JSX transform)
- **Module Resolution**: bundler (optimized for Next.js)

## Development Guidelines

### Creating New Pages
1. Create a new folder in `src/app/[route-name]/`
2. Add `page.tsx` for the route component
3. Optionally add `layout.tsx` for route-specific layouts
4. Use Server Components by default; add `"use client"` only when needed

### Styling Approach
- Tailwind utility classes are the primary styling method
- Custom CSS variables defined in `globals.css` for theme colors
- Background/foreground colors adapt automatically for dark mode
- Use `className` prop for styling (not `style` unless absolutely necessary)

### Font Usage
Two fonts are pre-configured:
- `--font-geist-sans`: Primary sans-serif font
- `--font-geist-mono`: Monospace font for code

Access via Tailwind: `font-sans` and `font-mono`

### ESLint Configuration
- Uses Next.js flat config format (`.mjs` file)
- Includes Next.js core web vitals and TypeScript rules
- Ignores `.next/`, `out/`, `build/`, and `next-env.d.ts`

## Common Patterns

### Server Component (Default)
```tsx
// src/app/my-route/page.tsx
export default async function MyPage() {
  // Can directly fetch data, no useEffect needed
  const data = await fetch('...')
  return <div>...</div>
}
```

### Client Component
```tsx
"use client"

import { useState } from "react"

export default function MyClientComponent() {
  const [state, setState] = useState(0)
  return <button onClick={() => setState(state + 1)}>{state}</button>
}
```

### Metadata Configuration
```tsx
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Page Title",
  description: "Page description",
}
```

## Important Notes

- **Image Optimization**: Use `next/image` component for all images (already imported in page.tsx)
- **TypeScript Strict Mode**: All new code must pass strict type checking
- **React 19**: Uses the latest React features and concurrent rendering
- **Tailwind v4**: Note that the configuration syntax differs from v3; uses PostCSS plugin approach
- **No Tailwind Config File**: Tailwind v4 doesn't use `tailwind.config.js`; configuration is in CSS via `@theme`
