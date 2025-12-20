# UI Coding Standards

## Core Principle

**This project uses ONLY [shadcn/ui](https://ui.shadcn.com/) components for all user interface elements.**

## Absolute Requirements

### ✅ DO
- **ONLY** use shadcn/ui components for all UI needs
- Install shadcn/ui components using the CLI: `npx shadcn@latest add <component-name>`
- Compose shadcn/ui components together to create complex interfaces
- Customize shadcn/ui components through:
  - Tailwind CSS classes
  - Component props and variants
  - Modifying the component files in `src/components/ui/` (these are considered shadcn components, not custom components)
- Reference the [shadcn/ui documentation](https://ui.shadcn.com/docs) for available components and usage patterns

### ❌ DO NOT
- **ABSOLUTELY NO custom components** should be created from scratch
- Do not create components using raw HTML elements (div, button, input, etc.) for UI purposes
- Do not use third-party UI libraries or component systems
- Do not create custom styled components outside of the shadcn/ui ecosystem

## Implementation Guidelines

### Installing Components

When you need a UI component:

1. Check the [shadcn/ui components](https://ui.shadcn.com/docs/components) catalog
2. Install using the CLI:
   ```bash
   npx shadcn@latest add button
   npx shadcn@latest add card
   npx shadcn@latest add dialog
   # etc.
   ```
3. Import and use the component in your application

### Customization

shadcn/ui components are added to your project as source code in `src/components/ui/`. You can customize them by:

- Editing the component file directly
- Adding new variants to the component
- Modifying default styles
- Extending functionality

**This is the ONLY acceptable way to customize UI components.**

### Composition Over Creation

Build complex interfaces by composing shadcn/ui components together:

```tsx
// ✅ CORRECT: Composing shadcn components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function WorkoutCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Workout</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Start Workout</Button>
      </CardContent>
    </Card>
  )
}
```

```tsx
// ❌ INCORRECT: Creating custom components
export function CustomCard() {
  return (
    <div className="rounded-lg border p-4">
      <h2>Today's Workout</h2>
      <button className="px-4 py-2 bg-blue-500">Start Workout</button>
    </div>
  )
}
```

## Available Component Categories

shadcn/ui provides components across multiple categories:

- **Layout**: Card, Separator, Aspect Ratio, etc.
- **Forms**: Input, Textarea, Select, Checkbox, Radio, Switch, etc.
- **Buttons & Actions**: Button, Toggle, etc.
- **Overlays**: Dialog, Sheet, Popover, Dropdown Menu, etc.
- **Feedback**: Alert, Toast, Progress, Skeleton, etc.
- **Data Display**: Table, Badge, Avatar, etc.
- **Navigation**: Tabs, Navigation Menu, Breadcrumb, etc.

Always check the [components documentation](https://ui.shadcn.com/docs/components) before implementing any UI feature.

## Enforcement

This standard is **non-negotiable**. All pull requests and code reviews should verify:

1. No custom UI components exist outside of shadcn/ui
2. All UI elements use shadcn/ui components
3. Any customization is done within the shadcn/ui component files in `src/components/ui/`

## Questions?

If you need a UI element and can't find an appropriate shadcn/ui component:

1. Review the full [components list](https://ui.shadcn.com/docs/components)
2. Check if multiple shadcn components can be composed to achieve the desired result
3. Consider if an existing shadcn component can be extended with new variants

**When in doubt, use shadcn/ui components.**
