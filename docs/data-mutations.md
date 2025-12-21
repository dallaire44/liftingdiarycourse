# Data Mutations

## Core Principle

**ALL data mutations (create, update, delete) in this application MUST follow a strict two-layer architecture: helper functions in `/data` directory wrapped by Server Actions with Zod validation.**

## Absolute Requirements

### ✅ DO

- **ONLY** perform database mutations through helper functions in the `src/data` directory
- Use helper functions that wrap Drizzle ORM queries
- Implement ALL mutations via Server Actions in colocated `actions.ts` files
- Use **typed parameters** for Server Actions (NOT `FormData`)
- **ALWAYS** validate Server Action arguments using Zod schemas
- Filter by `userId` to ensure users can only mutate their own data
- Use `revalidatePath()` or `revalidateTag()` to update cached data after mutations

### ❌ DO NOT

- **ABSOLUTELY NO** direct database queries in Server Actions
- Do not use `FormData` as Server Action parameter types
- Do not skip Zod validation for any Server Action
- Do not use raw SQL queries
- Do not create mutations in route handlers or API routes
- Do not allow users to mutate other users' data
- Do not trust client-side data without validation
- **Do not use `redirect()` within Server Actions** - handle redirects client-side after the action resolves

## Architecture Overview

```
┌─────────────────┐
│  UI Component   │
│  (Client/RSC)   │
└────────┬────────┘
         │ calls
         ▼
┌─────────────────┐
│ Server Action   │ ← Zod validation
│  (actions.ts)   │ ← Auth checks
└────────┬────────┘
         │ calls
         ▼
┌─────────────────┐
│ Helper Function │ ← Drizzle ORM
│  (/data/*.ts)   │ ← Type-safe queries
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Database     │
└─────────────────┘
```

## Layer 1: Helper Functions in `/data`

### Requirements

1. **Location**: ALL database mutations MUST have corresponding helper functions in `src/data` directory
2. **ORM**: MUST use Drizzle ORM - **NO RAW SQL QUERIES**
3. **Naming**: Use clear, descriptive action names (e.g., `createWorkout`, `updateExercise`, `deleteSet`)
4. **Type Safety**: Leverage TypeScript and Drizzle's type inference
5. **Single Responsibility**: Each helper function should perform one specific mutation

### Example: `/data/workouts.ts`

```typescript
import { db } from '@/db';
import { workouts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// CREATE
export async function createWorkout(data: {
  userId: string;
  name: string;
  description?: string;
  date: Date;
}) {
  const [workout] = await db
    .insert(workouts)
    .values({
      userId: data.userId, // CRITICAL: Always set userId
      name: data.name,
      description: data.description,
      date: data.date,
      createdAt: new Date(),
    })
    .returning();

  return workout;
}

// UPDATE
export async function updateWorkout(data: {
  workoutId: string;
  userId: string;
  name?: string;
  description?: string;
  date?: Date;
}) {
  const [workout] = await db
    .update(workouts)
    .set({
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.date && { date: data.date }),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(workouts.id, data.workoutId),
        eq(workouts.userId, data.userId) // CRITICAL: Verify ownership
      )
    )
    .returning();

  return workout;
}

// DELETE
export async function deleteWorkout(workoutId: string, userId: string) {
  const [deleted] = await db
    .delete(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId) // CRITICAL: Only delete if user owns it
      )
    )
    .returning();

  return deleted;
}
```

## Layer 2: Server Actions with Zod Validation

### Requirements

1. **Location**: ALL Server Actions MUST be in colocated `actions.ts` files
2. **'use server'**: MUST include `'use server'` directive at the top
3. **Typed Parameters**: Parameters MUST be typed - **NO `FormData` type**
4. **Zod Validation**: **ALL** parameters MUST be validated with Zod schemas
5. **Authentication**: Always verify user authentication
6. **Authorization**: Always pass `userId` to helper functions
7. **Revalidation**: Call `revalidatePath()` or `revalidateTag()` after mutations
8. **Error Handling**: Return type-safe error responses

### Example: `app/workouts/actions.ts`

```typescript
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth'; // or your auth solution
import {
  createWorkout,
  updateWorkout,
  deleteWorkout,
} from '@/data/workouts';

// Zod schemas for validation
const createWorkoutSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  date: z.coerce.date(),
});

const updateWorkoutSchema = z.object({
  workoutId: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  date: z.coerce.date().optional(),
});

const deleteWorkoutSchema = z.object({
  workoutId: z.string().uuid(),
});

// Server Actions
export async function createWorkoutAction(input: z.infer<typeof createWorkoutSchema>) {
  // 1. Validate input with Zod
  const validatedInput = createWorkoutSchema.parse(input);

  // 2. Check authentication
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // 3. Call helper function with userId
  const workout = await createWorkout({
    userId: session.user.id,
    ...validatedInput,
  });

  // 4. Revalidate affected paths
  revalidatePath('/workouts');
  revalidatePath('/dashboard');

  // 5. Return result
  return { success: true, workout };
}

export async function updateWorkoutAction(input: z.infer<typeof updateWorkoutSchema>) {
  // 1. Validate input
  const validatedInput = updateWorkoutSchema.parse(input);

  // 2. Check authentication
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // 3. Call helper function
  const workout = await updateWorkout({
    ...validatedInput,
    userId: session.user.id, // CRITICAL: Pass userId for authorization
  });

  // 4. Check if workout exists (helper returns undefined if not found/unauthorized)
  if (!workout) {
    throw new Error('Workout not found or unauthorized');
  }

  // 5. Revalidate
  revalidatePath('/workouts');
  revalidatePath(`/workouts/${validatedInput.workoutId}`);

  return { success: true, workout };
}

export async function deleteWorkoutAction(input: z.infer<typeof deleteWorkoutSchema>) {
  // 1. Validate input
  const validatedInput = deleteWorkoutSchema.parse(input);

  // 2. Check authentication
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // 3. Call helper function
  const deleted = await deleteWorkout(validatedInput.workoutId, session.user.id);

  if (!deleted) {
    throw new Error('Workout not found or unauthorized');
  }

  // 4. Revalidate
  revalidatePath('/workouts');
  revalidatePath('/dashboard');

  return { success: true };
}
```

## Usage in Components

### Client Components

```typescript
'use client';

import { useState } from 'react';
import { createWorkoutAction } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function CreateWorkoutForm() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      // Call Server Action with typed object (NOT FormData)
      const result = await createWorkoutAction({
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        date: new Date(formData.get('date') as string),
      });

      if (result.success) {
        // Handle success
      }
    } catch (error) {
      // Handle validation or mutation errors
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input name="name" placeholder="Workout name" required />
      <Input name="description" placeholder="Description" />
      <Input name="date" type="date" required />
      <Button type="submit" disabled={isLoading}>
        Create Workout
      </Button>
    </form>
  );
}
```

### Server Components

```typescript
import { createWorkoutAction } from './actions';
import { Button } from '@/components/ui/button';

export default async function WorkoutPage() {
  // Server Components can also trigger mutations
  async function handleQuickCreate() {
    'use server';

    await createWorkoutAction({
      name: 'Quick Workout',
      date: new Date(),
    });
  }

  return (
    <form action={handleQuickCreate}>
      <Button type="submit">Create Quick Workout</Button>
    </form>
  );
}
```

## Redirects and Navigation

### CRITICAL: No redirect() in Server Actions

**Server Actions MUST NOT use the `redirect()` function.** All redirects and navigation should be handled client-side after the Server Action resolves.

#### Why?

1. **User Experience**: Client-side redirects provide better control over loading states and error handling
2. **Form Reset**: Allows you to reset forms and clean up state before navigating
3. **Error Handling**: Server-side redirects bypass error handling, making it difficult to show errors to users
4. **Flexibility**: Client-side control enables optimistic updates, toast notifications, and conditional navigation

### ❌ WRONG: redirect() in Server Action

```typescript
'use server';

import { redirect } from 'next/navigation';
import { createWorkout } from '@/data/workouts';

export async function createWorkoutAction(input: CreateWorkoutInput) {
  const validatedInput = createWorkoutSchema.parse(input);
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const workout = await createWorkout({
    userId: session.user.id,
    ...validatedInput,
  });

  revalidatePath('/workouts');

  // ❌ DON'T DO THIS - redirect in Server Action
  redirect('/dashboard');
}
```

### ✅ CORRECT: Client-side redirect after action resolves

```typescript
'use server';

import { createWorkout } from '@/data/workouts';

export async function createWorkoutAction(input: CreateWorkoutInput) {
  const validatedInput = createWorkoutSchema.parse(input);
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const workout = await createWorkout({
    userId: session.user.id,
    ...validatedInput,
  });

  revalidatePath('/workouts');

  // ✅ Return success with data - NO redirect
  return { success: true, workout };
}
```

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { createWorkoutAction } from './actions';

export function CreateWorkoutForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await createWorkoutAction({
        name: formData.get('name') as string,
        date: new Date(formData.get('date') as string),
      });

      if (result.success) {
        // ✅ Handle redirect CLIENT-SIDE after action resolves
        router.push('/dashboard');
        router.refresh();
      } else {
        // Handle error
        alert(result.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return <form onSubmit={handleSubmit}>{/* form fields */}</form>;
}
```

### Pattern: Post-Mutation Navigation

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createWorkoutAction } from './actions';

export function CreateWorkoutForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(data: FormData) {
    setIsLoading(true);

    try {
      const result = await createWorkoutAction({
        name: data.get('name') as string,
        date: new Date(data.get('date') as string),
      });

      if (result.success) {
        // Option 1: Navigate to a specific page
        router.push('/dashboard');

        // Option 2: Navigate to the created resource
        router.push(`/workouts/${result.workout.id}`);

        // Option 3: Go back to previous page
        router.back();

        // Always refresh to get latest server data
        router.refresh();
      } else {
        // Show error to user
        console.error(result.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  // ... rest of component
}
```

### Pattern: Conditional Navigation

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { updateWorkoutAction } from './actions';

export function EditWorkoutForm({ workoutId }: { workoutId: string }) {
  const router = useRouter();

  async function handleSubmit(data: FormData) {
    const result = await updateWorkoutAction({
      workoutId,
      name: data.get('name') as string,
    });

    if (result.success) {
      // Conditional navigation based on user action
      const shouldReturnToDashboard = data.get('returnToDashboard') === 'true';

      if (shouldReturnToDashboard) {
        router.push('/dashboard');
      } else {
        router.push(`/workouts/${workoutId}`);
      }

      router.refresh();
    }
  }

  // ... rest of component
}
```

## Advanced Patterns

### Pattern 1: Nested Mutations

```typescript
// /data/workouts.ts
export async function createWorkoutWithExercises(data: {
  userId: string;
  name: string;
  exercises: Array<{ exerciseId: string; sets: number; reps: number }>;
}) {
  // Use Drizzle transaction for atomic operations
  return await db.transaction(async (tx) => {
    // Create workout
    const [workout] = await tx
      .insert(workouts)
      .values({
        userId: data.userId,
        name: data.name,
      })
      .returning();

    // Create workout exercises
    if (data.exercises.length > 0) {
      await tx.insert(workoutExercises).values(
        data.exercises.map((exercise) => ({
          workoutId: workout.id,
          exerciseId: exercise.exerciseId,
          sets: exercise.sets,
          reps: exercise.reps,
        }))
      );
    }

    return workout;
  });
}

// app/workouts/actions.ts
const createWorkoutWithExercisesSchema = z.object({
  name: z.string().min(1).max(100),
  exercises: z.array(
    z.object({
      exerciseId: z.string().uuid(),
      sets: z.number().int().min(1).max(10),
      reps: z.number().int().min(1).max(100),
    })
  ),
});

export async function createWorkoutWithExercisesAction(
  input: z.infer<typeof createWorkoutWithExercisesSchema>
) {
  const validatedInput = createWorkoutWithExercisesSchema.parse(input);
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const workout = await createWorkoutWithExercises({
    userId: session.user.id,
    ...validatedInput,
  });

  revalidatePath('/workouts');
  return { success: true, workout };
}
```

### Pattern 2: Optimistic Updates with Error Handling

```typescript
'use client';

import { useOptimistic } from 'react';
import { deleteWorkoutAction } from './actions';

export function WorkoutList({ workouts }: { workouts: Workout[] }) {
  const [optimisticWorkouts, removeOptimisticWorkout] = useOptimistic(
    workouts,
    (state, workoutId: string) => state.filter((w) => w.id !== workoutId)
  );

  async function handleDelete(workoutId: string) {
    // Optimistically remove from UI
    removeOptimisticWorkout(workoutId);

    try {
      // Call Server Action with validation
      await deleteWorkoutAction({ workoutId });
    } catch (error) {
      // Error will cause automatic revalidation and UI update
      console.error('Failed to delete workout:', error);
    }
  }

  return (
    <ul>
      {optimisticWorkouts.map((workout) => (
        <li key={workout.id}>
          {workout.name}
          <button onClick={() => handleDelete(workout.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
```

### Pattern 3: Safe Error Handling

```typescript
'use server';

import { z } from 'zod';

export async function updateWorkoutAction(input: z.infer<typeof updateWorkoutSchema>) {
  try {
    // Validate input
    const validatedInput = updateWorkoutSchema.parse(input);

    // Check auth
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Perform mutation
    const workout = await updateWorkout({
      ...validatedInput,
      userId: session.user.id,
    });

    if (!workout) {
      return { success: false, error: 'Workout not found' };
    }

    // Revalidate
    revalidatePath('/workouts');

    return { success: true, workout };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input',
        issues: error.issues,
      };
    }

    // Handle other errors
    console.error('Mutation error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
```

## Security Checklist

Before deploying any mutation code, verify:

- [ ] ✅ All Server Actions have Zod validation
- [ ] ✅ All Server Actions check authentication
- [ ] ✅ All helper functions receive and filter by `userId`
- [ ] ✅ No `FormData` types in Server Action signatures
- [ ] ✅ All mutations use Drizzle ORM (no raw SQL)
- [ ] ✅ All mutations call helper functions from `/data` directory
- [ ] ✅ All mutations revalidate affected cache paths
- [ ] ✅ Error responses don't leak sensitive information
- [ ] ✅ No `redirect()` calls within Server Actions (redirects handled client-side)

## File Organization

```
src/
├── data/
│   ├── workouts.ts          # Workout mutation helpers
│   ├── exercises.ts         # Exercise mutation helpers
│   └── sets.ts              # Set mutation helpers
└── app/
    ├── workouts/
    │   ├── actions.ts        # Workout Server Actions
    │   └── page.tsx
    ├── exercises/
    │   ├── actions.ts        # Exercise Server Actions
    │   └── page.tsx
    └── dashboard/
        └── page.tsx
```

## Common Mistakes to Avoid

### ❌ WRONG: FormData parameter

```typescript
// DON'T DO THIS
export async function createWorkout(formData: FormData) {
  const name = formData.get('name') as string;
  // ...
}
```

### ✅ CORRECT: Typed parameter with Zod

```typescript
// DO THIS
export async function createWorkoutAction(input: z.infer<typeof createWorkoutSchema>) {
  const validatedInput = createWorkoutSchema.parse(input);
  // ...
}
```

### ❌ WRONG: Direct DB query in action

```typescript
// DON'T DO THIS
export async function createWorkoutAction(input: CreateWorkoutInput) {
  await db.insert(workouts).values({ ... });
}
```

### ✅ CORRECT: Call helper function

```typescript
// DO THIS
export async function createWorkoutAction(input: CreateWorkoutInput) {
  const validatedInput = createWorkoutSchema.parse(input);
  await createWorkout({ ...validatedInput, userId: session.user.id });
}
```

### ❌ WRONG: No Zod validation

```typescript
// DON'T DO THIS
export async function updateWorkoutAction(input: any) {
  await updateWorkout(input);
}
```

### ✅ CORRECT: Zod validation

```typescript
// DO THIS
export async function updateWorkoutAction(input: z.infer<typeof updateWorkoutSchema>) {
  const validatedInput = updateWorkoutSchema.parse(input);
  await updateWorkout(validatedInput);
}
```

## Summary

1. ✅ **Two-layer architecture**: Server Actions call helper functions in `/data`
2. ✅ **Drizzle ORM only** for all database mutations
3. ✅ **Typed parameters** - NO `FormData` in Server Action signatures
4. ✅ **Zod validation** is MANDATORY for all Server Actions
5. ✅ **Always filter by userId** to prevent unauthorized mutations
6. ✅ **Colocated actions.ts files** for Server Actions
7. ✅ **Revalidate cache** after mutations
8. ✅ **Client-side redirects** - handle navigation after Server Action resolves
9. ❌ **NO direct DB queries** in Server Actions
10. ❌ **NO raw SQL** anywhere
11. ❌ **NO skipping validation** for any reason
12. ❌ **NO redirect()** calls within Server Actions

**This standard is non-negotiable and MUST be followed for all data mutations.**
