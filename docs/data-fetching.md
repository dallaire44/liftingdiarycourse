# Data Fetching

## CRITICAL: Server Components ONLY

**ALL data fetching within this application MUST be done via Server Components.**

### ✅ ALLOWED
- Server Components fetching data
- Server Components calling helper functions from `/data` directory

### ❌ NOT ALLOWED
- Route handlers for data fetching
- Client components fetching data
- API routes for database queries
- Direct database queries in components
- Any other method of data fetching

## Database Query Architecture

### Helper Functions in `/data` Directory

**ALL database queries MUST be done via helper functions located in the `/data` directory.**

#### Requirements

1. **Location**: All data access functions MUST be in `/data` directory
2. **ORM**: MUST use Drizzle ORM - **NO RAW SQL QUERIES**
3. **Naming**: Use descriptive names that clearly indicate the data being fetched
4. **Type Safety**: Leverage TypeScript and Drizzle's type inference

#### Example Structure

```typescript
// /data/workouts.ts
import { db } from '@/db';
import { workouts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function getUserWorkouts(userId: string) {
  return await db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, userId));
}

export async function getWorkoutById(workoutId: string, userId: string) {
  const [workout] = await db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId) // CRITICAL: Always filter by userId
      )
    )
    .limit(1);

  return workout;
}
```

## CRITICAL: Data Isolation & Security

### User Data Access Rules

**A logged-in user can ONLY access their own data. They MUST NOT be able to access any other user's data.**

#### Security Requirements

1. **Always Filter by User ID**: Every query MUST include a filter for the current user's ID
2. **No Shared Data**: Users cannot access data belonging to other users
3. **Server-Side Validation**: All user ID checks happen on the server
4. **No Client-Side Trust**: Never trust user IDs from client-side code

#### Implementation Pattern

```typescript
// CORRECT ✅
export async function getUserData(userId: string) {
  return await db
    .select()
    .from(someTable)
    .where(eq(someTable.userId, userId)); // Always filter by userId
}

// WRONG ❌
export async function getData() {
  return await db.select().from(someTable); // No user filtering!
}
```

### Using Helper Functions in Server Components

```typescript
// app/dashboard/page.tsx
import { getUserWorkouts } from '@/data/workouts';
import { auth } from '@/auth'; // or your auth solution

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Fetch data in server component using helper function
  const workouts = await getUserWorkouts(session.user.id);

  return (
    <div>
      {/* Render workouts */}
    </div>
  );
}
```

## Why Server Components Only?

1. **Security**: Database credentials never exposed to client
2. **Performance**: Reduce client bundle size
3. **SEO**: Data available for initial page render
4. **Simplicity**: No need for API routes or state management for data fetching
5. **Type Safety**: End-to-end type safety from database to component

## Common Patterns

### Pattern 1: List Page

```typescript
// app/exercises/page.tsx
import { getUserExercises } from '@/data/exercises';
import { auth } from '@/auth';

export default async function ExercisesPage() {
  const session = await auth();
  const exercises = await getUserExercises(session.user.id);

  return <ExerciseList exercises={exercises} />;
}
```

### Pattern 2: Detail Page

```typescript
// app/workouts/[id]/page.tsx
import { getWorkoutById } from '@/data/workouts';
import { auth } from '@/auth';
import { notFound } from 'next/navigation';

export default async function WorkoutPage({
  params
}: {
  params: { id: string }
}) {
  const session = await auth();
  const workout = await getWorkoutById(params.id, session.user.id);

  if (!workout) {
    notFound();
  }

  return <WorkoutDetail workout={workout} />;
}
```

### Pattern 3: Nested Data

```typescript
// /data/workouts.ts
import { db } from '@/db';
import { workouts, exercises } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function getWorkoutWithExercises(
  workoutId: string,
  userId: string
) {
  return await db.query.workouts.findFirst({
    where: and(
      eq(workouts.id, workoutId),
      eq(workouts.userId, userId) // ALWAYS filter by userId
    ),
    with: {
      exercises: true
    }
  });
}
```

## Mutations and Actions

For data mutations (create, update, delete), use Server Actions:

```typescript
// app/actions/workouts.ts
'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { workouts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function createWorkout(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const name = formData.get('name') as string;

  await db.insert(workouts).values({
    userId: session.user.id, // CRITICAL: Set userId
    name,
    // ... other fields
  });

  revalidatePath('/workouts');
}

export async function deleteWorkout(workoutId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // CRITICAL: Verify ownership before deletion
  await db
    .delete(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, session.user.id) // Only delete if user owns it
      )
    );

  revalidatePath('/workouts');
}
```

## Summary

1. ✅ **Server Components ONLY** for data fetching
2. ✅ **Helper functions in `/data`** for all database queries
3. ✅ **Drizzle ORM** - NO raw SQL
4. ✅ **Always filter by userId** - users can ONLY access their own data
5. ❌ **NO route handlers, client fetching, or API routes** for data access
