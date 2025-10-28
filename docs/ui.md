# UI Coding Standards

This document outlines the strict UI coding standards for the Lifting Diary Course project. All developers must adhere to these guidelines without exception.

## UI Component Library

### shadcn/ui - MANDATORY

**CRITICAL RULE**: This project uses **shadcn/ui components EXCLUSIVELY** for all user interface elements.

#### Requirements

- ✅ **ONLY** use shadcn/ui components for all UI elements
- ❌ **ABSOLUTELY NO** custom components should be created
- ❌ **NO** direct HTML elements for interactive UI (buttons, inputs, forms, etc.)
- ❌ **NO** third-party component libraries besides shadcn/ui

#### What This Means

1. **For buttons**: Use `<Button>` from shadcn/ui, NOT `<button>` or custom components
2. **For inputs**: Use `<Input>` from shadcn/ui, NOT `<input>` or custom components
3. **For forms**: Use shadcn/ui form components with React Hook Form integration
4. **For dialogs/modals**: Use `<Dialog>` from shadcn/ui
5. **For cards**: Use `<Card>` from shadcn/ui
6. **For any UI element**: Check shadcn/ui first, use their component

#### Installing shadcn/ui Components

When you need a new component:

```bash
npx shadcn@latest add [component-name]
```

Example:
```bash
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add card
npx shadcn@latest add dialog
```

#### Component Usage Example

```tsx
// ✅ CORRECT - Using shadcn/ui components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardContent } from "@/components/ui/card"

export default function MyComponent() {
  return (
    <Card>
      <CardHeader>Title</CardHeader>
      <CardContent>
        <Input placeholder="Enter text" />
        <Button>Submit</Button>
      </CardContent>
    </Card>
  )
}

// ❌ INCORRECT - Custom components or raw HTML
export default function MyComponent() {
  return (
    <div className="custom-card">
      <input placeholder="Enter text" />
      <button>Submit</button>
    </div>
  )
}
```

## Date Formatting

### date-fns - Required Library

All date formatting in this project **MUST** use the `date-fns` library.

#### Installation

```bash
npm install date-fns
```

#### Date Format Standard

Dates throughout the application must be displayed in the following format:

```
[Ordinal Day] [Abbreviated Month] [Full Year]
```

**Examples:**
- 1st Sep 2025
- 2nd Aug 2025
- 3rd Jan 2026
- 4th Jun 2024
- 21st Dec 2024
- 22nd Nov 2025
- 23rd Mar 2026

#### Implementation

Use the `format` function from date-fns with the following pattern:

```typescript
import { format } from "date-fns"

// Helper function for ordinal suffix
function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return "th"
  switch (day % 10) {
    case 1: return "st"
    case 2: return "nd"
    case 3: return "rd"
    default: return "th"
  }
}

// Format date function
function formatDate(date: Date): string {
  const day = format(date, "d")
  const suffix = getOrdinalSuffix(parseInt(day))
  const monthYear = format(date, "MMM yyyy")
  return `${day}${suffix} ${monthYear}`
}

// Usage
const formattedDate = formatDate(new Date()) // "28th Oct 2025"
```

#### Recommended Utility File

Create a utility file for consistent date formatting:

**File**: `src/lib/date-utils.ts`

```typescript
import { format } from "date-fns"

/**
 * Get ordinal suffix for a day number (1st, 2nd, 3rd, 4th, etc.)
 */
export function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return "th"
  switch (day % 10) {
    case 1: return "st"
    case 2: return "nd"
    case 3: return "rd"
    default: return "th"
  }
}

/**
 * Format a date in the standard project format: "1st Sep 2025"
 */
export function formatStandardDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const day = format(dateObj, "d")
  const suffix = getOrdinalSuffix(parseInt(day))
  const monthYear = format(dateObj, "MMM yyyy")
  return `${day}${suffix} ${monthYear}`
}
```

**Usage throughout the app:**

```typescript
import { formatStandardDate } from "@/lib/date-utils"

// In your component
const displayDate = formatStandardDate(new Date()) // "28th Oct 2025"
const displayDate2 = formatStandardDate("2025-09-01") // "1st Sep 2025"
```

## Summary of Rules

### UI Components
1. **ONLY shadcn/ui** - No exceptions
2. **NO custom components** - Use shadcn/ui components
3. **Install as needed** - Use `npx shadcn@latest add [component]`
4. **Consistent imports** - Import from `@/components/ui/[component]`

### Date Formatting
1. **ONLY date-fns** - No other date libraries
2. **Standard format** - "1st Sep 2025" format (ordinal day + abbreviated month + full year)
3. **Use utility function** - Create and use `formatStandardDate()` for consistency
4. **No manual formatting** - Always use the date-fns library

## Enforcement

These standards are **non-negotiable**. All code must follow these guidelines:

- ✅ Code reviews must check for shadcn/ui usage
- ✅ All dates must use the standard format
- ❌ Pull requests with custom UI components will be rejected
- ❌ Inconsistent date formatting will require refactoring

## Resources

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [date-fns Documentation](https://date-fns.org/)
- [date-fns format Function](https://date-fns.org/docs/format)
