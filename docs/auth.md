# Authentication Standards

## Core Principle

**This application uses ONLY [Clerk](https://clerk.com/) for all authentication and user management.**

## Absolute Requirements

### ✅ DO
- **ONLY** use Clerk for authentication, authorization, and user management
- Use Clerk's provided React components for auth UI (`<SignIn />`, `<SignUp />`, `<UserButton />`, etc.)
- Use Clerk's hooks for accessing user data and auth state (`useUser()`, `useAuth()`, `useClerk()`)
- Protect routes using Clerk's middleware and route protection utilities
- Store user metadata in Clerk's user object
- Use Clerk's session management and token handling
- Reference the [Clerk Next.js documentation](https://clerk.com/docs/quickstarts/nextjs) for implementation patterns

### ❌ DO NOT
- **ABSOLUTELY NO custom authentication** systems or JWT implementations
- Do not use other authentication libraries (NextAuth, Auth0, Firebase Auth, etc.)
- Do not create custom login/signup forms from scratch
- Do not manually handle session tokens or cookies
- Do not store authentication state in local storage or client-side state managers
- Do not implement custom password hashing or user credential storage

## Installation & Setup

### Installing Clerk

```bash
npm install @clerk/nextjs
```

### Environment Variables

Add the following to your `.env.local`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Optional: Customize sign-in/sign-up URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

### Root Layout Configuration

Wrap your application with `ClerkProvider` in the root layout:

```typescript
// src/app/layout.tsx
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

### Middleware for Route Protection

Create `middleware.ts` in the root directory:

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/',
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
```

## Component Usage

### Sign In / Sign Up Pages

```typescript
// src/app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  )
}
```

```typescript
// src/app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  )
}
```

### User Button (Profile Management)

```typescript
import { UserButton } from '@clerk/nextjs'

export function Header() {
  return (
    <header>
      <nav>
        <UserButton afterSignOutUrl="/" />
      </nav>
    </header>
  )
}
```

## Accessing User Data

### Client Components

Use Clerk's React hooks in client components:

```typescript
'use client'

import { useUser } from '@clerk/nextjs'

export function WelcomeMessage() {
  const { isLoaded, isSignedIn, user } = useUser()

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  if (!isSignedIn) {
    return <div>Please sign in</div>
  }

  return (
    <div>
      <h1>Welcome, {user.firstName}!</h1>
      <p>{user.emailAddresses[0].emailAddress}</p>
    </div>
  )
}
```

### Server Components & Server Actions

Use Clerk's server-side utilities:

```typescript
// Server Component
import { auth, currentUser } from '@clerk/nextjs/server'

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    return <div>Not authenticated</div>
  }

  const user = await currentUser()

  return (
    <div>
      <h1>Dashboard for {user?.firstName}</h1>
    </div>
  )
}
```

```typescript
// Server Action
'use server'

import { auth } from '@clerk/nextjs/server'

export async function createWorkout(formData: FormData) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  // Create workout for userId...
}
```

### API Routes

```typescript
// src/app/api/workouts/route.ts
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch user's workouts...
  return NextResponse.json({ workouts: [] })
}
```

## Authorization Patterns

### Checking Authentication Status

```typescript
'use client'

import { useAuth } from '@clerk/nextjs'

export function ProtectedButton() {
  const { isSignedIn, isLoaded } = useAuth()

  if (!isLoaded) return null

  return isSignedIn ? (
    <button>Create Workout</button>
  ) : (
    <button>Sign in to create workouts</button>
  )
}
```

### Role-Based Access Control

```typescript
'use client'

import { useUser } from '@clerk/nextjs'

export function AdminPanel() {
  const { user } = useUser()

  // Check user role from public metadata
  const isAdmin = user?.publicMetadata?.role === 'admin'

  if (!isAdmin) {
    return <div>Access denied</div>
  }

  return <div>Admin Panel</div>
}
```

## User Metadata

Clerk provides two types of metadata:

- **Public Metadata**: Accessible to both frontend and backend, visible in JWT
- **Private Metadata**: Only accessible from backend, not in JWT

```typescript
// Update user metadata (backend only)
import { clerkClient } from '@clerk/nextjs/server'

export async function promoteToAdmin(userId: string) {
  await clerkClient().users.updateUserMetadata(userId, {
    publicMetadata: {
      role: 'admin',
    },
  })
}
```

## Common Hooks & Utilities

### Client-Side Hooks

- `useUser()` - Get the current user object and authentication state
- `useAuth()` - Get authentication state and session information
- `useClerk()` - Access the Clerk instance for advanced operations
- `useSignIn()` - Programmatic sign-in control
- `useSignUp()` - Programmatic sign-up control

### Server-Side Utilities

- `auth()` - Get userId and session claims in Server Components/Actions
- `currentUser()` - Get the full User object on the server
- `clerkClient()` - Access Clerk's Backend API

## Styling Clerk Components

Clerk components can be customized using the `appearance` prop:

```typescript
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <SignIn
      appearance={{
        elements: {
          formButtonPrimary: 'bg-blue-500 hover:bg-blue-600',
          card: 'shadow-lg',
        },
      }}
    />
  )
}
```

Or configure globally in `ClerkProvider`:

```typescript
<ClerkProvider
  appearance={{
    baseTheme: 'dark', // or 'light'
    variables: {
      colorPrimary: '#3b82f6',
    },
  }}
>
  {children}
</ClerkProvider>
```

## Testing Considerations

For development and testing:

1. Use Clerk's development instance with test API keys
2. Clerk provides test users in development mode
3. Never commit API keys to version control

## Enforcement

This standard is **non-negotiable**. All code reviews should verify:

1. No custom authentication code exists
2. All user authentication uses Clerk's provided APIs and components
3. Sensitive routes are protected using Clerk's middleware
4. User data is accessed through Clerk's hooks and utilities

## Questions?

If you need authentication functionality:

1. Review the [Clerk Next.js documentation](https://clerk.com/docs/quickstarts/nextjs)
2. Check the [Clerk Component Reference](https://clerk.com/docs/components/overview)
3. Review the [Clerk Hooks Reference](https://clerk.com/docs/references/react/use-user)

**When in doubt, use Clerk's provided solutions.**
