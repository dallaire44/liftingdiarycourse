# Formatting Standards

## Date Formatting

### Core Principle

**All date formatting in this project MUST use [date-fns](https://date-fns.org/).**

### Standard Date Format

Dates should be displayed in the following format throughout the application:

```
1st Sep 2025
2nd Aug 2025
3rd Jan 2026
4th Jun 2024
```

**Format breakdown:**
- Day with ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
- Month abbreviated to 3 letters (Jan, Feb, Mar, etc.)
- Full 4-digit year

### Implementation

#### Installation

```bash
npm install date-fns
```

#### Usage

```typescript
import { format } from 'date-fns'

// Format a date
const date = new Date('2025-09-01')
const formatted = format(date, 'do MMM yyyy')
// Output: "1st Sep 2025"
```

#### Complete Example

```typescript
import { format } from 'date-fns'

interface WorkoutSessionProps {
  date: Date
  exercise: string
}

export function WorkoutSession({ date, exercise }: WorkoutSessionProps) {
  const formattedDate = format(date, 'do MMM yyyy')

  return (
    <div>
      <p>{exercise}</p>
      <time dateTime={date.toISOString()}>{formattedDate}</time>
    </div>
  )
}
```

### Format String Reference

The format string `'do MMM yyyy'` breaks down as:
- `do` - Day of month with ordinal (1st, 2nd, 3rd, 21st, etc.)
- `MMM` - Month abbreviated (Jan, Feb, Mar, etc.)
- `yyyy` - Full year (2025, 2026, etc.)

### Requirements

✅ **DO:**
- Use `date-fns` for all date formatting
- Use the format `'do MMM yyyy'` as the standard display format
- Import only the `format` function when that's all you need (tree-shaking)
- Use the `<time>` HTML element with `dateTime` attribute for semantic HTML

❌ **DO NOT:**
- Use native JavaScript date formatting methods (`.toLocaleDateString()`, `.toDateString()`, etc.)
- Use other date libraries (moment.js, dayjs, luxon, etc.)
- Create custom date formatting functions
- Hardcode date strings
- Use different date formats in different parts of the application

### Additional date-fns Usage

While the standard display format is `'do MMM yyyy'`, you may use other date-fns functions for other date operations:

```typescript
import {
  format,
  addDays,
  subDays,
  isAfter,
  isBefore,
  parseISO,
  startOfWeek,
  endOfWeek
} from 'date-fns'

// Always format for display using the standard format
const displayDate = format(someDate, 'do MMM yyyy')
```

### Accessibility

When displaying dates, always use semantic HTML:

```typescript
// ✅ CORRECT: Semantic HTML with machine-readable datetime
<time dateTime={date.toISOString()}>
  {format(date, 'do MMM yyyy')}
</time>

// ❌ INCORRECT: Just a span or div
<span>{format(date, 'do MMM yyyy')}</span>
```

## Future Formatting Standards

Additional formatting standards (numbers, currency, etc.) will be added to this document as needed.
