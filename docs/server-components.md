# Server Components

## Core Principle

**Server Components are the default component type in this Next.js 15 application. They provide superior performance, security, and SEO benefits.**

## Critical: Next.js 15 Params Requirement

### ✅ REQUIRED: Await `params` and `searchParams`

**In Next.js 15, `params` and `searchParams` are ALWAYS Promises and MUST be awaited.**

This is a breaking change from Next.js 14 and earlier versions.

#### ❌ WRONG: Not awaiting params (Next.js 14 pattern)

```typescript
// DON'T DO THIS - Will cause runtime errors in Next.js 15
export default async function WorkoutPage({
  params
}: {
  params: { workoutId: string }
}) {
  const workout = await getWorkoutById(params.workoutId) // ❌ ERROR!
  // ...
}
```

#### ✅ CORRECT: Awaiting params (Next.js 15 pattern)

```typescript
// DO THIS - Await params before accessing properties
export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ workoutId: string }>
}) {
  const { workoutId } = await params // ✅ CORRECT
  const workout = await getWorkoutById(workoutId)
  // ...
}
```

### Type Definitions

**Always type `params` and `searchParams` as Promises:**

```typescript
// ✅ CORRECT typing for Next.js 15
interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params
  const search = await searchParams
  // ...
}
```

### Common Patterns

#### Pattern 1: Single Dynamic Route Parameter

```typescript
// app/workouts/[id]/page.tsx
export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workoutId = parseInt(id, 10)

  if (isNaN(workoutId)) {
    notFound()
  }

  const workout = await getWorkoutById(workoutId, userId)
  // ...
}
```

#### Pattern 2: Multiple Dynamic Route Parameters

```typescript
// app/workouts/[workoutId]/exercises/[exerciseId]/page.tsx
export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ workoutId: string; exerciseId: string }>
}) {
  const { workoutId, exerciseId } = await params
  // ...
}
```

#### Pattern 3: Combining params and searchParams

```typescript
// app/exercises/page.tsx
export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; filter?: string }>
}) {
  const { sort, filter } = await searchParams

  const exercises = await getUserExercises(userId, {
    sortBy: sort || 'name',
    filterBy: filter,
  })
  // ...
}
```

#### Pattern 4: Using both params and searchParams

```typescript
// app/workouts/[id]/page.tsx
export default async function WorkoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ view?: string }>
}) {
  const { id } = await params
  const { view } = await searchParams

  const workout = await getWorkoutById(parseInt(id, 10), userId)
  const viewMode = view || 'default'
  // ...
}
```

## Server Component Best Practices

### 1. Authentication and Authorization

**ALWAYS check authentication at the start of Server Components:**

```typescript
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Component logic continues...
}
```

### 2. Data Fetching

**Fetch data directly in Server Components using helper functions from `/data` directory:**

```typescript
import { getUserWorkouts } from '@/data/workouts'
import { auth } from '@clerk/nextjs/server'

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Direct data fetching in Server Component
  const workouts = await getUserWorkouts(userId)

  return (
    <div>
      {/* Render workouts */}
    </div>
  )
}
```

### 3. Error Handling

**Use Next.js error boundaries and not-found pages:**

```typescript
import { notFound } from 'next/navigation'

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workoutId = parseInt(id, 10)

  if (isNaN(workoutId)) {
    notFound() // Returns 404 page
  }

  const workout = await getWorkoutById(workoutId, userId)

  if (!workout) {
    notFound() // Workout doesn't exist or user doesn't own it
  }

  return <WorkoutDetail workout={workout} />
}
```

### 4. Metadata Generation

**Generate metadata dynamically using the `generateMetadata` function:**

```typescript
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const workout = await getWorkoutById(parseInt(id, 10), userId)

  if (!workout) {
    return {
      title: 'Workout Not Found',
    }
  }

  return {
    title: workout.name || `Workout ${workout.id}`,
    description: `View details for ${workout.name || 'this workout'}`,
  }
}

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Page component...
}
```

### 5. Streaming and Suspense

**Use React Suspense for streaming data:**

```typescript
import { Suspense } from 'react'
import { WorkoutList } from './workout-list'
import { Skeleton } from '@/components/ui/skeleton'

export default async function DashboardPage() {
  const { userId } = await auth()

  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<WorkoutListSkeleton />}>
        <WorkoutList userId={userId} />
      </Suspense>
    </div>
  )
}

async function WorkoutList({ userId }: { userId: string }) {
  const workouts = await getUserWorkouts(userId)
  return <div>{/* Render workouts */}</div>
}

function WorkoutListSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  )
}
```

### 6. Parallel Data Fetching

**Fetch multiple data sources in parallel:**

```typescript
export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { userId } = await auth()
  const { id } = await params
  const workoutId = parseInt(id, 10)

  // Parallel data fetching
  const [workout, exercises, userStats] = await Promise.all([
    getWorkoutById(workoutId, userId),
    getUserExercises(userId),
    getUserStats(userId),
  ])

  if (!workout) {
    notFound()
  }

  return (
    <div>
      {/* Render workout, exercises, and stats */}
    </div>
  )
}
```

## When to Use Server vs Client Components

### Use Server Components (Default) When:

- ✅ Fetching data from a database
- ✅ Accessing backend resources directly
- ✅ Keeping sensitive information on the server (API keys, tokens)
- ✅ Reducing client-side JavaScript bundle size
- ✅ No interactivity required (no state, effects, or event handlers)

### Use Client Components When:

- ✅ Using React hooks (useState, useEffect, useReducer, etc.)
- ✅ Handling browser-only APIs (localStorage, geolocation, etc.)
- ✅ Adding event listeners (onClick, onChange, etc.)
- ✅ Using interactivity and state
- ✅ Using custom hooks

## Server Component Patterns

### Pattern 1: Layout with Server Component

```typescript
// app/dashboard/layout.tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div className="dashboard-layout">
      <nav>{/* Navigation */}</nav>
      <main>{children}</main>
    </div>
  )
}
```

### Pattern 2: Server Component with Client Component Children

```typescript
// app/workouts/page.tsx (Server Component)
import { getUserWorkouts } from '@/data/workouts'
import { WorkoutCard } from './workout-card' // Client Component

export default async function WorkoutsPage() {
  const { userId } = await auth()
  const workouts = await getUserWorkouts(userId)

  return (
    <div>
      {workouts.map((workout) => (
        <WorkoutCard key={workout.id} workout={workout} />
      ))}
    </div>
  )
}
```

```typescript
// app/workouts/workout-card.tsx (Client Component)
'use client'

import { useState } from 'react'

export function WorkoutCard({ workout }: { workout: Workout }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div onClick={() => setIsExpanded(!isExpanded)}>
      {/* Interactive card */}
    </div>
  )
}
```

### Pattern 3: Passing Server Actions to Client Components

```typescript
// app/workouts/page.tsx (Server Component)
import { deleteWorkout } from '@/app/actions/workouts'
import { WorkoutList } from './workout-list'

export default async function WorkoutsPage() {
  const { userId } = await auth()
  const workouts = await getUserWorkouts(userId)

  return <WorkoutList workouts={workouts} deleteAction={deleteWorkout} />
}
```

```typescript
// app/workouts/workout-list.tsx (Client Component)
'use client'

export function WorkoutList({
  workouts,
  deleteAction,
}: {
  workouts: Workout[]
  deleteAction: (id: number) => Promise<{ success: boolean }>
}) {
  async function handleDelete(id: number) {
    await deleteAction(id)
  }

  return (
    <div>
      {/* Render workouts with delete button */}
    </div>
  )
}
```

## Common Mistakes to Avoid

### ❌ WRONG: Not awaiting params

```typescript
// DON'T DO THIS
export default async function Page({
  params
}: {
  params: { id: string } // Missing Promise type
}) {
  const workout = await getWorkout(params.id) // Runtime error!
}
```

### ✅ CORRECT: Awaiting params

```typescript
// DO THIS
export default async function Page({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workout = await getWorkout(id)
}
```

### ❌ WRONG: Using hooks in Server Components

```typescript
// DON'T DO THIS - Server Components can't use hooks
export default async function Page() {
  const [state, setState] = useState(0) // ❌ ERROR
  const { userId } = await auth()
  // ...
}
```

### ✅ CORRECT: Extract to Client Component

```typescript
// app/page.tsx (Server Component)
import { Counter } from './counter'

export default async function Page() {
  const { userId } = await auth()
  return <Counter />
}

// app/counter.tsx (Client Component)
'use client'

export function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

### ❌ WRONG: Importing Server Components into Client Components

```typescript
// DON'T DO THIS
'use client'

import { ServerComponent } from './server-component' // ❌ Will become client component

export function ClientComponent() {
  return <ServerComponent /> // Now runs on client
}
```

### ✅ CORRECT: Pass as children or props

```typescript
// app/layout.tsx (Server Component)
import { ServerComponent } from './server-component'
import { ClientComponent } from './client-component'

export default function Layout() {
  return (
    <ClientComponent>
      <ServerComponent /> {/* Stays server component */}
    </ClientComponent>
  )
}

// app/client-component.tsx
'use client'

export function ClientComponent({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}
```

## Performance Optimization

### 1. Cache Data Fetching

```typescript
import { unstable_cache } from 'next/cache'

const getCachedWorkouts = unstable_cache(
  async (userId: string) => getUserWorkouts(userId),
  ['user-workouts'],
  { revalidate: 3600 } // Cache for 1 hour
)

export default async function DashboardPage() {
  const { userId } = await auth()
  const workouts = await getCachedWorkouts(userId)
  // ...
}
```

### 2. Revalidation

```typescript
// Time-based revalidation
export const revalidate = 3600 // Revalidate every hour

// Dynamic revalidation
export const dynamic = 'force-dynamic' // Opt out of caching

// Tag-based revalidation (use with revalidateTag in Server Actions)
export const tags = ['workouts']
```

## Security Checklist for Server Components

- [ ] ✅ Always verify user authentication with `await auth()`
- [ ] ✅ Always await `params` and `searchParams` (Next.js 15 requirement)
- [ ] ✅ Always filter data by `userId` when fetching
- [ ] ✅ Return 404 for unauthorized or non-existent resources
- [ ] ✅ Never expose sensitive data to client components
- [ ] ✅ Validate and sanitize dynamic route parameters
- [ ] ✅ Use helper functions from `/data` directory for database queries

## Summary

1. ✅ **ALWAYS await `params` and `searchParams`** - Required in Next.js 15
2. ✅ **Type them as Promises** - `params: Promise<{ id: string }>`
3. ✅ **Server Components are the default** - Use them for data fetching
4. ✅ **Check authentication first** - Use `await auth()` at component start
5. ✅ **Fetch data directly** - No need for API routes or state management
6. ✅ **Use Client Components sparingly** - Only for interactivity
7. ✅ **Return proper errors** - Use `notFound()` and `redirect()` appropriately
8. ✅ **Optimize with parallel fetching** - Use `Promise.all()` for multiple queries

**This standard is non-negotiable and MUST be followed for all Server Components in Next.js 15.**
