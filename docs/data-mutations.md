# Data Mutations Standards

This document defines the standards and patterns for data mutations in the Lifting Diary Course application.

## Core Principles

1. **All data mutations MUST use Server Actions** - Never mutate data directly from Client Components
2. **Server Actions MUST be in colocated `actions.ts` files** - Keep actions close to the features that use them
3. **Database access MUST go through helper functions** in `src/data/` directory
4. **Helper functions MUST use Drizzle ORM** - No raw SQL for mutations
5. **All Server Action parameters MUST be validated with Zod** - Type safety at runtime
6. **Never use FormData type** - Always use strongly-typed parameters
7. **NEVER use redirect() in Server Actions** - Redirects MUST be done client-side after the Server Action resolves

## Architecture Overview

```
User Action (Client)
    ↓
Server Action (actions.ts) → Validates with Zod
    ↓
Data Helper (src/data/*.ts) → Uses Drizzle ORM
    ↓
Database
```

## File Structure

```
src/
├── app/
│   └── [feature]/
│       ├── page.tsx              # UI Component
│       ├── actions.ts            # Server Actions (mutations)
│       └── _components/
│           └── form.tsx          # Form component
├── data/
│   ├── workouts.ts               # Workout data helpers
│   ├── exercises.ts              # Exercise data helpers
│   └── users.ts                  # User data helpers
└── db/
    ├── schema.ts                 # Drizzle schema definitions
    └── index.ts                  # Database connection
```

## Server Actions

### File Naming & Location
Server Actions MUST be in files named `actions.ts` colocated with the feature:

```
src/app/workouts/
├── page.tsx
├── actions.ts              ← Server Actions here
└── _components/
    └── workout-form.tsx
```

### Server Action Pattern

```tsx
"use server"

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createWorkout } from '@/data/workouts'

// 1. Define Zod schema for validation
const createWorkoutSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  date: z.string().datetime(),
  notes: z.string().optional(),
  exercises: z.array(z.object({
    exerciseId: z.string().uuid(),
    sets: z.number().int().positive(),
    reps: z.number().int().positive(),
    weight: z.number().positive().optional(),
  })),
})

// 2. Define TypeScript type from schema
type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>

// 3. Server Action with typed parameters (NOT FormData)
export async function createWorkoutAction(input: CreateWorkoutInput) {
  // 4. Authenticate user
  const { userId } = await auth()

  if (!userId) {
    return {
      success: false,
      error: 'Unauthorized'
    }
  }

  try {
    // 5. Validate input with Zod
    const validatedData = createWorkoutSchema.parse(input)

    // 6. Call data helper function
    const workout = await createWorkout({
      userId,
      ...validatedData,
    })

    // 7. Revalidate affected paths
    revalidatePath('/workouts')
    revalidatePath('/dashboard')

    // 8. Return success response
    return {
      success: true,
      data: workout
    }
  } catch (error) {
    // 9. Handle errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input',
        details: error.errors
      }
    }

    console.error('Failed to create workout:', error)
    return {
      success: false,
      error: 'Failed to create workout'
    }
  }
}
```

### Server Action Standards

#### ✅ DO: Use Typed Parameters
```tsx
"use server"

type UpdateWorkoutInput = {
  workoutId: string
  name: string
  date: string
}

export async function updateWorkoutAction(input: UpdateWorkoutInput) {
  // Implementation
}
```

#### ❌ DON'T: Use FormData
```tsx
"use server"

// ❌ WRONG - Never use FormData type
export async function updateWorkoutAction(formData: FormData) {
  const name = formData.get('name') as string
  // ...
}
```

#### ✅ DO: Validate with Zod
```tsx
"use server"

const schema = z.object({
  name: z.string().min(1),
  weight: z.number().positive(),
})

export async function myAction(input: unknown) {
  const validatedData = schema.parse(input)
  // Use validatedData
}
```

#### ✅ DO: Return Structured Responses
```tsx
type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: unknown }

export async function myAction(input: Input): Promise<ActionResponse<Output>> {
  try {
    const result = await dataHelper(input)
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: 'Operation failed' }
  }
}
```

#### ❌ DON'T: Use redirect() in Server Actions
```tsx
"use server"

import { redirect } from "next/navigation"

// ❌ WRONG - Never redirect from Server Actions
export async function createItemAction(input: Input) {
  const item = await createItem(input)
  redirect('/items') // ❌ WRONG!
}
```

**Why wrong**: Using `redirect()` in Server Actions can cause issues with form submissions and client-side state management. Redirects should be handled by the client after receiving the response.

#### ✅ DO: Handle Redirects Client-Side
```tsx
"use server"

// Server Action - returns success/error response
export async function createItemAction(input: Input) {
  const item = await createItem(input)
  revalidatePath('/items')
  return { success: true, data: item } // ✅ Return response
}
```

```tsx
"use client"

import { useRouter } from "next/navigation"

// Client Component - handles redirect after action
export function MyForm() {
  const router = useRouter()

  async function handleSubmit(data: FormData) {
    const result = await createItemAction(data)

    if (result.success) {
      router.push('/items') // ✅ Redirect client-side
      router.refresh()
    }
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

## Data Helper Functions

### Location & Organization
All database access helpers MUST be in the `src/data/` directory, organized by domain:

```
src/data/
├── workouts.ts      # Workout CRUD operations
├── exercises.ts     # Exercise CRUD operations
├── sets.ts          # Set CRUD operations
└── users.ts         # User-related data operations
```

### Data Helper Pattern

```tsx
// src/data/workouts.ts
import { db } from '@/db'
import { workouts, exercises, sets } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

// Types
export type CreateWorkoutData = {
  userId: string
  name: string
  date: string
  notes?: string
  exercises: {
    exerciseId: string
    sets: number
    reps: number
    weight?: number
  }[]
}

export type UpdateWorkoutData = {
  name?: string
  date?: string
  notes?: string
}

// Create operation
export async function createWorkout(data: CreateWorkoutData) {
  // Use Drizzle ORM
  const [workout] = await db
    .insert(workouts)
    .values({
      userId: data.userId,
      name: data.name,
      date: data.date,
      notes: data.notes,
    })
    .returning()

  // Handle related data
  if (data.exercises.length > 0) {
    await db.insert(exercises).values(
      data.exercises.map(ex => ({
        workoutId: workout.id,
        exerciseId: ex.exerciseId,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
      }))
    )
  }

  return workout
}

// Update operation
export async function updateWorkout(
  workoutId: string,
  userId: string,
  data: UpdateWorkoutData
) {
  const [updated] = await db
    .update(workouts)
    .set({
      ...data,
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId) // Always scope to user
      )
    )
    .returning()

  return updated
}

// Delete operation
export async function deleteWorkout(workoutId: string, userId: string) {
  const [deleted] = await db
    .delete(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId) // Always scope to user
      )
    )
    .returning()

  return deleted
}

// Read operations (for reference)
export async function getWorkoutById(workoutId: string, userId: string) {
  return await db.query.workouts.findFirst({
    where: and(
      eq(workouts.id, workoutId),
      eq(workouts.userId, userId)
    ),
    with: {
      exercises: true,
    },
  })
}
```

### Data Helper Standards

#### ✅ DO: Use Drizzle ORM
```tsx
// ✅ CORRECT
import { db } from '@/db'
import { workouts } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function createWorkout(data: WorkoutData) {
  return await db.insert(workouts).values(data).returning()
}
```

#### ❌ DON'T: Use Raw SQL
```tsx
// ❌ WRONG - Never use raw SQL
export async function createWorkout(data: WorkoutData) {
  return await db.execute(
    `INSERT INTO workouts (name, date) VALUES ($1, $2)`,
    [data.name, data.date]
  )
}
```

#### ✅ DO: Always Scope to User
```tsx
// ✅ CORRECT - Prevents data leaks
export async function updateWorkout(
  workoutId: string,
  userId: string,
  data: UpdateData
) {
  return await db
    .update(workouts)
    .set(data)
    .where(and(
      eq(workouts.id, workoutId),
      eq(workouts.userId, userId) // Critical security check
    ))
}
```

#### ✅ DO: Export Types
```tsx
// ✅ CORRECT - Types for consumers
export type CreateWorkoutData = {
  userId: string
  name: string
  date: string
}

export type UpdateWorkoutData = Partial<
  Omit<CreateWorkoutData, 'userId'>
>
```

## Validation with Zod

### Schema Definition
```tsx
import { z } from 'zod'

// Reusable schemas
const exerciseSchema = z.object({
  exerciseId: z.string().uuid('Invalid exercise ID'),
  sets: z.number().int().min(1).max(20),
  reps: z.number().int().min(1).max(100),
  weight: z.number().positive().optional(),
  notes: z.string().max(500).optional(),
})

const workoutSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long'),
  date: z.string().datetime('Invalid date format'),
  notes: z.string()
    .max(1000, 'Notes too long')
    .optional(),
  exercises: z.array(exerciseSchema)
    .min(1, 'At least one exercise required')
    .max(20, 'Too many exercises'),
})

// Refinements for complex validation
const createWorkoutSchema = workoutSchema.refine(
  (data) => {
    const workoutDate = new Date(data.date)
    const now = new Date()
    return workoutDate <= now
  },
  { message: 'Workout date cannot be in the future' }
)
```

### Using Schemas in Server Actions
```tsx
"use server"

import { z } from 'zod'

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
})

type UpdateProfileInput = z.infer<typeof updateProfileSchema>

export async function updateProfileAction(input: UpdateProfileInput) {
  const { userId } = await auth()

  if (!userId) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    // Validate
    const validatedData = updateProfileSchema.parse(input)

    // Mutate
    const profile = await updateUserProfile(userId, validatedData)

    return { success: true, data: profile }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.flatten().fieldErrors
      }
    }

    return { success: false, error: 'Update failed' }
  }
}
```

## Client-Side Usage

### Calling Server Actions from Client Components

```tsx
"use client"

import { useState } from 'react'
import { createWorkoutAction } from './actions'

export function WorkoutForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(data: CreateWorkoutInput) {
    setIsLoading(true)
    setError(null)

    const result = await createWorkoutAction(data)

    if (result.success) {
      // Handle success
      console.log('Workout created:', result.data)
    } else {
      // Handle error
      setError(result.error)
    }

    setIsLoading(false)
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      // Collect form data into typed object
      const formData = {
        name: e.currentTarget.workoutName.value,
        date: e.currentTarget.workoutDate.value,
        exercises: [], // ... collect exercises
      }
      handleSubmit(formData)
    }}>
      {/* Form fields */}
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Workout'}
      </button>
    </form>
  )
}
```

### With React Hook Form + Zod

```tsx
"use client"

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createWorkoutAction } from './actions'

// Shared schema (can be exported from actions.ts)
const workoutFormSchema = z.object({
  name: z.string().min(1).max(100),
  date: z.string().datetime(),
  notes: z.string().optional(),
})

type WorkoutFormData = z.infer<typeof workoutFormSchema>

export function WorkoutForm() {
  const form = useForm<WorkoutFormData>({
    resolver: zodResolver(workoutFormSchema),
    defaultValues: {
      name: '',
      date: new Date().toISOString(),
      notes: '',
    },
  })

  async function onSubmit(data: WorkoutFormData) {
    const result = await createWorkoutAction(data)

    if (result.success) {
      form.reset()
      // Show success message
    } else {
      // Show error message
      console.error(result.error)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields with form.register() */}
    </form>
  )
}
```

## Optimistic Updates

### Pattern for Optimistic UI Updates

```tsx
"use client"

import { useOptimistic } from 'react'
import { toggleWorkoutCompleteAction } from './actions'

type Workout = {
  id: string
  name: string
  completed: boolean
}

export function WorkoutList({ workouts }: { workouts: Workout[] }) {
  const [optimisticWorkouts, setOptimisticWorkouts] =
    useOptimistic(workouts)

  async function toggleComplete(workoutId: string) {
    // Optimistically update UI
    setOptimisticWorkouts((current) =>
      current.map((w) =>
        w.id === workoutId ? { ...w, completed: !w.completed } : w
      )
    )

    // Perform server action
    const result = await toggleWorkoutCompleteAction(workoutId)

    if (!result.success) {
      // Handle error - optimistic update will revert automatically
      console.error(result.error)
    }
  }

  return (
    <ul>
      {optimisticWorkouts.map((workout) => (
        <li key={workout.id}>
          <span>{workout.name}</span>
          <button onClick={() => toggleComplete(workout.id)}>
            {workout.completed ? 'Completed' : 'Mark Complete'}
          </button>
        </li>
      ))}
    </ul>
  )
}
```

## Error Handling

### Consistent Error Response Pattern

```tsx
"use server"

export type ActionResult<T> =
  | { success: true; data: T }
  | {
      success: false
      error: string
      code?: 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'NOT_FOUND' | 'SERVER_ERROR'
      details?: unknown
    }

export async function myAction(input: Input): Promise<ActionResult<Output>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED'
      }
    }

    const validatedData = schema.parse(input)
    const result = await dataHelper(userId, validatedData)

    if (!result) {
      return {
        success: false,
        error: 'Resource not found',
        code: 'NOT_FOUND'
      }
    }

    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input',
        code: 'VALIDATION_ERROR',
        details: error.flatten().fieldErrors
      }
    }

    console.error('Action failed:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
      code: 'SERVER_ERROR'
    }
  }
}
```

## Revalidation & Cache Management

### Revalidate Affected Routes

```tsx
"use server"

import { revalidatePath, revalidateTag } from 'next/cache'

export async function createWorkoutAction(input: CreateWorkoutInput) {
  // ... mutation logic

  // Revalidate specific paths
  revalidatePath('/workouts')
  revalidatePath('/dashboard')
  revalidatePath(`/workouts/${result.id}`)

  // Or revalidate by tag
  revalidateTag('workouts')

  return { success: true, data: result }
}
```

## Security Checklist

- [ ] All Server Actions authenticate the user with `auth()`
- [ ] All data helpers scope queries to the authenticated user
- [ ] All Server Action inputs are validated with Zod
- [ ] No sensitive data is logged or returned to the client
- [ ] Authorization checks are performed before mutations
- [ ] Rate limiting is implemented for sensitive operations (if needed)

## Testing Server Actions

```tsx
import { describe, it, expect, vi } from 'vitest'
import { createWorkoutAction } from './actions'

// Mock auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => ({ userId: 'test-user-id' })),
}))

// Mock data helper
vi.mock('@/data/workouts', () => ({
  createWorkout: vi.fn((data) => ({
    id: 'workout-123',
    ...data,
  })),
}))

describe('createWorkoutAction', () => {
  it('creates a workout with valid input', async () => {
    const input = {
      name: 'Leg Day',
      date: new Date().toISOString(),
      exercises: [],
    }

    const result = await createWorkoutAction(input)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Leg Day')
    }
  })

  it('returns error for invalid input', async () => {
    const input = {
      name: '', // Invalid - empty string
      date: new Date().toISOString(),
      exercises: [],
    }

    const result = await createWorkoutAction(input)

    expect(result.success).toBe(false)
  })
})
```

## Common Patterns

### Batch Operations
```tsx
"use server"

export async function deleteMultipleWorkoutsAction(
  input: { workoutIds: string[] }
) {
  const schema = z.object({
    workoutIds: z.array(z.string().uuid()).min(1).max(50),
  })

  const { userId } = await auth()
  if (!userId) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const { workoutIds } = schema.parse(input)

    await deleteMultipleWorkouts(workoutIds, userId)

    revalidatePath('/workouts')
    return { success: true, data: { deleted: workoutIds.length } }
  } catch (error) {
    return { success: false, error: 'Delete failed' }
  }
}
```

### File Upload with Mutation
```tsx
"use server"

export async function uploadWorkoutImageAction(input: {
  workoutId: string
  imageUrl: string
}) {
  const schema = z.object({
    workoutId: z.string().uuid(),
    imageUrl: z.string().url(),
  })

  const { userId } = await auth()
  if (!userId) {
    return { success: false, error: 'Unauthorized' }
  }

  const { workoutId, imageUrl } = schema.parse(input)

  const updated = await updateWorkoutImage(workoutId, userId, imageUrl)

  revalidatePath(`/workouts/${workoutId}`)
  return { success: true, data: updated }
}
```

## Summary

✅ **DO**:
- Use Server Actions in colocated `actions.ts` files
- Validate all inputs with Zod
- Use typed parameters (never FormData)
- Call data helpers from `src/data/`
- Use Drizzle ORM for all database operations
- Always authenticate and authorize
- Return structured responses
- Revalidate affected paths

❌ **DON'T**:
- Use FormData type for Server Action parameters
- Write raw SQL queries
- Mutate data directly from Client Components
- Skip validation
- Forget to scope queries to the authenticated user
- Expose sensitive data in responses
