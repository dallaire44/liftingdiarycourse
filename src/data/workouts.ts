import { db } from "@/db"
import { workouts, workoutExercises, exercises, sets } from "@/db/schema"
import { eq, and, gte, lt, desc } from "drizzle-orm"

/**
 * Get workouts for a specific user and date
 * CRITICAL: Always filters by userId for security
 *
 * @param userId - The authenticated user's ID (from Clerk)
 * @param date - The date to fetch workouts for
 * @returns Array of workouts with their exercises and sets
 */
export async function getWorkoutsByUserIdAndDate(userId: string, date: Date) {
  // Normalize date to start of day (00:00:00)
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  // End of day (23:59:59.999)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  // CRITICAL: Filter by userId to enforce data isolation
  const userWorkouts = await db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.userId, userId),
        eq(workouts.isTemplate, false), // Only get actual workouts, not templates
        gte(workouts.date, startOfDay),
        lt(workouts.date, endOfDay)
      )
    )
    .orderBy(desc(workouts.date))

  // For each workout, fetch its exercises and sets
  const workoutsWithDetails = await Promise.all(
    userWorkouts.map(async (workout) => {
      // Get workout exercises with exercise details
      const workoutExercisesList = await db
        .select({
          id: workoutExercises.id,
          order: workoutExercises.order,
          exerciseId: exercises.id,
          exerciseName: exercises.name,
          exerciseCategory: exercises.category,
        })
        .from(workoutExercises)
        .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
        .where(eq(workoutExercises.workoutId, workout.id))
        .orderBy(workoutExercises.order)

      // For each workout exercise, fetch its sets
      const exercisesWithSets = await Promise.all(
        workoutExercisesList.map(async (workoutExercise) => {
          const exerciseSets = await db
            .select({
              id: sets.id,
              setNumber: sets.setNumber,
              reps: sets.reps,
              weight: sets.weight,
              rir: sets.rir,
            })
            .from(sets)
            .where(eq(sets.workoutExerciseId, workoutExercise.id))
            .orderBy(sets.setNumber)

          return {
            id: workoutExercise.id,
            exerciseId: workoutExercise.exerciseId,
            exerciseName: workoutExercise.exerciseName,
            exerciseCategory: workoutExercise.exerciseCategory,
            order: workoutExercise.order,
            sets: exerciseSets,
          }
        })
      )

      return {
        id: workout.id,
        name: workout.name,
        date: workout.date,
        exercises: exercisesWithSets,
      }
    })
  )

  return workoutsWithDetails
}

/**
 * Get all workouts for a specific user (without date filter)
 * CRITICAL: Always filters by userId for security
 *
 * @param userId - The authenticated user's ID (from Clerk)
 * @returns Array of workouts
 */
export async function getWorkoutsByUserId(userId: string) {
  // CRITICAL: Filter by userId to enforce data isolation
  return await db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.userId, userId),
        eq(workouts.isTemplate, false)
      )
    )
    .orderBy(desc(workouts.date))
}

/**
 * Get a specific workout by ID for a user
 * CRITICAL: Filters by BOTH userId AND workoutId for security
 *
 * @param userId - The authenticated user's ID (from Clerk)
 * @param workoutId - The workout ID to fetch
 * @returns The workout or null if not found
 */
export async function getWorkoutByIdAndUserId(userId: string, workoutId: string) {
  // CRITICAL: Filter by BOTH userId AND workoutId
  const result = await db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.userId, userId),
        eq(workouts.id, workoutId)
      )
    )

  return result[0] ?? null
}

/**
 * Create a new workout with exercises and sets
 * CRITICAL: Associates workout with userId
 *
 * @param userId - The authenticated user's ID (from Clerk)
 * @param data - Workout data to create
 * @returns The created workout
 */
export type CreateWorkoutData = {
  name?: string
  date: Date
  exercises: {
    exerciseId: string
    order: number
    sets: {
      setNumber: number
      reps: number
      weight?: number
      rir?: number
    }[]
  }[]
}

export async function createWorkout(userId: string, data: CreateWorkoutData) {
  // Create the workout
  const [workout] = await db
    .insert(workouts)
    .values({
      userId,
      name: data.name,
      date: data.date,
      isTemplate: false,
    })
    .returning()

  // Create workout exercises with their sets
  for (const exercise of data.exercises) {
    const [workoutExercise] = await db
      .insert(workoutExercises)
      .values({
        workoutId: workout.id,
        exerciseId: exercise.exerciseId,
        order: exercise.order,
      })
      .returning()

    // Create sets for this workout exercise
    if (exercise.sets.length > 0) {
      await db.insert(sets).values(
        exercise.sets.map((set) => ({
          workoutExerciseId: workoutExercise.id,
          setNumber: set.setNumber,
          reps: set.reps,
          weight: set.weight?.toString(),
          rir: set.rir,
        }))
      )
    }
  }

  return workout
}
