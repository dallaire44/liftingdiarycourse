# Authentication Standards

This document defines the authentication patterns and standards for the Lifting Diary Course application.

## Authentication Provider

This application uses **[Clerk](https://clerk.com)** for authentication and user management.

## Key Principles

1. **Clerk is the single source of truth** for all authentication and user management
2. **Never implement custom auth logic** - always use Clerk's provided hooks, components, and utilities
3. **Server-side auth checks** are required for all protected routes and API endpoints
4. **Client-side auth** should only be used for UI rendering decisions, never for security

## Installation & Setup

### Dependencies
```bash
npm install @clerk/nextjs
```

### Environment Variables
Required environment variables in `.env.local`:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Optional: Custom sign-in/sign-up URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### Root Layout Configuration
Wrap the application with `ClerkProvider` in `src/app/layout.tsx`:

```tsx
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

## Server Components

### Protected Routes (Server Components)
Use `auth()` helper to get user authentication state:

```tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return <div>Protected content for user: {userId}</div>
}
```

### Getting User Data (Server Components)
Use `currentUser()` to access full user object:

```tsx
import { currentUser } from '@clerk/nextjs/server'

export default async function ProfilePage() {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  return (
    <div>
      <h1>Welcome, {user.firstName}!</h1>
      <p>Email: {user.emailAddresses[0].emailAddress}</p>
    </div>
  )
}
```

## Client Components

### Authentication State
Use the `useUser()` hook to access user state:

```tsx
"use client"

import { useUser } from '@clerk/nextjs'

export function UserProfile() {
  const { isSignedIn, user, isLoaded } = useUser()

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  if (!isSignedIn) {
    return <div>Please sign in</div>
  }

  return <div>Hello, {user.firstName}!</div>
}
```

### Pre-built Components
Always use Clerk's pre-built components for auth UI:

```tsx
"use client"

import { SignIn, SignUp, UserButton, SignOutButton } from '@clerk/nextjs'

// Sign-in page
export function SignInPage() {
  return <SignIn />
}

// Sign-up page
export function SignUpPage() {
  return <SignUp />
}

// User menu button (in header/navbar)
export function Header() {
  return (
    <header>
      <UserButton afterSignOutUrl="/" />
    </header>
  )
}

// Custom sign-out button
export function CustomSignOut() {
  return (
    <SignOutButton>
      <button>Sign Out</button>
    </SignOutButton>
  )
}
```

## Middleware (Route Protection)

Create `src/middleware.ts` to protect routes at the edge:

```tsx
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/workouts(.*)',
  '/profile(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
```

## API Routes

### Protected API Routes
```tsx
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Handle authenticated request
  return NextResponse.json({ data: 'Protected data' })
}
```

### Accessing User in API Routes
```tsx
import { currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const user = await currentUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    userId: user.id,
    email: user.emailAddresses[0].emailAddress
  })
}
```

## Server Actions

### Protected Server Actions
```tsx
"use server"

import { auth } from '@clerk/nextjs/server'

export async function createWorkout(formData: FormData) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  // Process workout creation with userId
}
```

## User Data Patterns

### User ID as Database Key
Always use Clerk's `userId` as the foreign key in your database:

```tsx
// Example: Linking workouts to users
type Workout = {
  id: string
  userId: string  // Clerk user ID
  name: string
  date: string
  exercises: Exercise[]
}
```

### Accessing User Metadata
Clerk provides metadata storage for additional user data:

```tsx
const user = await currentUser()

// Public metadata (readable by anyone)
const publicData = user?.publicMetadata

// Private metadata (only readable by the user)
const privateData = user?.privateMetadata

// Unsafe metadata (managed by Clerk Dashboard/API)
const unsafeData = user?.unsafeMetadata
```

## Common Hooks & Utilities

### Client-Side Hooks
- `useUser()` - Get current user state
- `useAuth()` - Get auth state and helpers
- `useSignIn()` - Control sign-in flow
- `useSignUp()` - Control sign-up flow
- `useSession()` - Get session information
- `useClerk()` - Access Clerk instance

### Server-Side Helpers
- `auth()` - Get auth state (userId, sessionId, etc.)
- `currentUser()` - Get full user object
- `clerkClient` - Direct API access to Clerk

## Security Best Practices

1. **Never trust client-side auth checks** for security decisions
2. **Always validate userId on the server** for protected operations
3. **Use middleware** to protect entire route groups
4. **Never expose Clerk Secret Key** to the client
5. **Use Server Actions** for mutations requiring authentication
6. **Implement proper error handling** for auth failures

## Testing Considerations

### Development Users
Use Clerk's test mode for development:
- Test users are automatically created
- No email verification required in test mode
- Switch to production mode before deploying

### Auth Testing Pattern
```tsx
// In tests, mock Clerk hooks
jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    isSignedIn: true,
    user: { id: 'test-user-id', firstName: 'Test' },
    isLoaded: true,
  }),
}))
```

## Sign-In/Sign-Up Pages

### Recommended File Structure
```
src/app/
├── sign-in/
│   └── [[...sign-in]]/
│       └── page.tsx
└── sign-up/
    └── [[...sign-up]]/
        └── page.tsx
```

### Sign-In Page Example
```tsx
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  )
}
```

## Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk Components](https://clerk.com/docs/components/overview)

## Migration Notes

If migrating from another auth provider:
1. Export user data from old provider
2. Create users in Clerk via API or CSV import
3. Update all auth checks to use Clerk patterns
4. Update middleware and route protection
5. Test thoroughly before deploying
