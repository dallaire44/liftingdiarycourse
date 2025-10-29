import { db } from "@/db"
import { exercises } from "@/db/schema"
import { eq, and } from "drizzle-orm"

/**
 * Get all exercises for a specific user
 * CRITICAL: Always filters by userId for security
 *
 * @param userId - The authenticated user's ID (from Clerk)
 * @returns Array of exercises
 */
export async function getExercisesByUserId(userId: string) {
  // CRITICAL: Filter by userId to enforce data isolation
  return await db
    .select()
    .from(exercises)
    .where(eq(exercises.userId, userId))
    .orderBy(exercises.name)
}

/**
 * Get a specific exercise by ID for a user
 * CRITICAL: Filters by BOTH userId AND exerciseId for security
 *
 * @param userId - The authenticated user's ID (from Clerk)
 * @param exerciseId - The exercise ID to fetch
 * @returns The exercise or null if not found
 */
export async function getExerciseByIdAndUserId(userId: string, exerciseId: string) {
  // CRITICAL: Filter by BOTH userId AND exerciseId
  const result = await db
    .select()
    .from(exercises)
    .where(
      and(
        eq(exercises.userId, userId),
        eq(exercises.id, exerciseId)
      )
    )

  return result[0] ?? null
}

/**
 * Create a new exercise for a user
 * CRITICAL: Associates exercise with userId
 *
 * @param userId - The authenticated user's ID (from Clerk)
 * @param data - Exercise data to create
 * @returns The created exercise
 */
export type CreateExerciseData = {
  name: string
  category?: string
}

export async function createExercise(userId: string, data: CreateExerciseData) {
  const [exercise] = await db
    .insert(exercises)
    .values({
      userId,
      name: data.name,
      category: data.category,
    })
    .returning()

  return exercise
}
