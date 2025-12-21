import { db } from '@/db';
import { workouts } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * Fetches all workouts for a specific user, including related exercises and sets.
 * Results are ordered by start date (most recent first).
 *
 * SECURITY: This function ONLY returns workouts belonging to the specified userId.
 * No user can access another user's workout data.
 */
export async function getUserWorkouts(userId: string) {
  return await db.query.workouts.findMany({
    where: eq(workouts.userId, userId),
    orderBy: [desc(workouts.startedAt)],
    with: {
      workoutExercises: {
        orderBy: (workoutExercises, { asc }) => [asc(workoutExercises.order)],
        with: {
          exercise: true,
          sets: {
            orderBy: (sets, { asc }) => [asc(sets.setNumber)],
          },
        },
      },
    },
  });
}

/**
 * Fetches a specific workout by ID for a user.
 *
 * SECURITY: This function verifies that the workout belongs to the specified userId.
 * Returns null if the workout doesn't exist or doesn't belong to the user.
 */
export async function getWorkoutById(workoutId: number, userId: string) {
  return await db.query.workouts.findFirst({
    where: (workouts, { eq, and }) =>
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId)
      ),
    with: {
      workoutExercises: {
        orderBy: (workoutExercises, { asc }) => [asc(workoutExercises.order)],
        with: {
          exercise: true,
          sets: {
            orderBy: (sets, { asc }) => [asc(sets.setNumber)],
          },
        },
      },
    },
  });
}
