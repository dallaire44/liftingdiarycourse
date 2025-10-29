# Routing Standards

This document outlines the routing architecture and standards for the Lifting Diary Course application.

## Route Structure

### Dashboard-Centric Architecture

All application routes MUST be accessed via the `/dashboard` prefix:

```
/dashboard              # Main dashboard (protected)
/dashboard/workout      # Workout-related pages (protected)
/dashboard/profile      # User profile (protected)
/dashboard/settings     # App settings (protected)
```

**Rationale**: Centralizing all authenticated features under `/dashboard` provides:
- Clear separation between public and protected routes
- Simplified middleware configuration
- Consistent user experience
- Easier route protection implementation

### Public Routes

Only the following routes should be accessible without authentication:
- `/` - Landing/home page
- `/login` - Authentication page
- `/signup` - User registration page
- `/auth/*` - Auth callback routes (if using OAuth)

## Route Protection

### Middleware-Based Protection

All route protection MUST be implemented using Next.js middleware, not client-side redirects or component-level guards.

**File**: `src/middleware.ts`

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const isAuthenticated = // check auth status
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard')

  if (isProtectedRoute && !isAuthenticated) {
    // Redirect to login with return URL
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Why Middleware?

1. **Server-Side Execution**: Runs before the request completes, preventing unauthorized page loads
2. **Performance**: No client-side redirect flash
3. **Security**: Cannot be bypassed by client-side manipulation
4. **Centralized Logic**: Single source of truth for route protection
5. **SEO**: Proper HTTP redirects (307/308) instead of client-side navigation

### Anti-Patterns to AVOID

❌ **DO NOT** use client-side route guards:
```typescript
// WRONG - This runs in the browser and can be bypassed
"use client"
export default function ProtectedPage() {
  const { user } = useAuth()
  if (!user) redirect('/login') // Vulnerable!
}
```

❌ **DO NOT** protect routes in Server Components:
```typescript
// WRONG - This runs too late in the request lifecycle
export default async function ProtectedPage() {
  const user = await getUser()
  if (!user) redirect('/login') // Inefficient and late
}
```

✅ **DO** use middleware for all route protection

## Nested Routes

### Dashboard Sub-Routes

Organize dashboard features using nested route segments:

```
/dashboard/
  ├── page.tsx                    # Dashboard home
  ├── layout.tsx                  # Shared dashboard layout
  ├── workout/
  │   ├── page.tsx               # Workout list
  │   ├── [workoutId]/
  │   │   ├── page.tsx          # Workout detail
  │   │   └── edit/
  │   │       └── page.tsx      # Edit workout
  │   └── new/
  │       └── page.tsx          # Create workout
  └── profile/
      └── page.tsx              # User profile
```

### Layout Composition

Use nested layouts to share UI across related routes:

```typescript
// src/app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="dashboard-container">
      <DashboardNav />
      <main>{children}</main>
    </div>
  )
}
```

All pages under `/dashboard/*` will automatically wrap with this layout.

## Route Patterns

### Dynamic Routes

Use bracket notation for dynamic segments:

```
[workoutId]/page.tsx    # Matches /dashboard/workout/123
[...slug]/page.tsx      # Catch-all route
[[...slug]]/page.tsx    # Optional catch-all
```

### Route Groups

Use parentheses for organization without affecting URLs:

```
(marketing)/
  ├── about/page.tsx     # URL: /about
  └── contact/page.tsx   # URL: /contact
(app)/
  └── dashboard/...      # URL: /dashboard/...
```

## Navigation

### Programmatic Navigation

Use Next.js router for client-side navigation:

```typescript
"use client"
import { useRouter } from 'next/navigation'

export function MyComponent() {
  const router = useRouter()

  const handleClick = () => {
    router.push('/dashboard/workout/123')
    // router.replace() for no history entry
    // router.back() to go back
    // router.refresh() to refresh data
  }
}
```

### Link Component

Use `<Link>` for declarative navigation:

```typescript
import Link from 'next/link'

<Link href="/dashboard/workout/new">Create Workout</Link>
```

### Server-Side Redirects

Use `redirect()` in Server Components/Actions:

```typescript
import { redirect } from 'next/navigation'

export default async function Page() {
  const user = await getUser()

  if (!user.hasCompletedOnboarding) {
    redirect('/dashboard/onboarding')
  }
}
```

## URL Parameters

### Search Parameters

Access search params in Server Components:

```typescript
export default function Page({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const filter = searchParams.filter // ?filter=active
  return <div>Filter: {filter}</div>
}
```

In Client Components:

```typescript
"use client"
import { useSearchParams } from 'next/navigation'

export function FilterComponent() {
  const searchParams = useSearchParams()
  const filter = searchParams.get('filter')
}
```

### Dynamic Segments

Access route parameters:

```typescript
export default function Page({
  params,
}: {
  params: { workoutId: string }
}) {
  return <div>Workout ID: {params.workoutId}</div>
}
```

## Best Practices

### 1. Consistent Route Naming
- Use kebab-case for route segments: `/workout-history` not `/workoutHistory`
- Keep URLs meaningful and readable
- Avoid unnecessary nesting (max 3-4 levels)

### 2. Type-Safe Routes
Define route constants to avoid typos:

```typescript
// src/lib/routes.ts
export const ROUTES = {
  DASHBOARD: '/dashboard',
  WORKOUT_LIST: '/dashboard/workout',
  WORKOUT_DETAIL: (id: string) => `/dashboard/workout/${id}`,
  WORKOUT_NEW: '/dashboard/workout/new',
} as const
```

### 3. Loading States
Provide `loading.tsx` files for automatic loading UI:

```typescript
// src/app/dashboard/workout/loading.tsx
export default function Loading() {
  return <Skeleton />
}
```

### 4. Error Boundaries
Add `error.tsx` files for error handling:

```typescript
// src/app/dashboard/workout/error.tsx
"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

### 5. Metadata per Route
Define metadata for SEO:

```typescript
export const metadata = {
  title: 'Workout List | Lifting Diary',
  description: 'View and manage your workout history',
}
```

## Security Considerations

1. **Never trust client-side route protection** - Always use middleware
2. **Validate route parameters** - Sanitize and validate all dynamic segments
3. **Check permissions** - Verify user has access to specific resources (e.g., can only view their own workouts)
4. **Return URLs** - When redirecting to login, preserve the intended destination
5. **Rate limiting** - Consider rate limiting on protected routes via middleware

## Testing Routes

### Route Protection Tests
```typescript
describe('Route Protection', () => {
  it('redirects unauthenticated users from /dashboard', async () => {
    const response = await fetch('/dashboard')
    expect(response.redirected).toBe(true)
    expect(response.url).toContain('/login')
  })
})
```

### Navigation Tests
```typescript
describe('Navigation', () => {
  it('navigates to workout detail', async () => {
    render(<WorkoutList />)
    await userEvent.click(screen.getByText('View Workout'))
    expect(window.location.pathname).toBe('/dashboard/workout/123')
  })
})
```

## References

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Next.js Middleware Documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Authentication Guide](/docs/auth.md)
