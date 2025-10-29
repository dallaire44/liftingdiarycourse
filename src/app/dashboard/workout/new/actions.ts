"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createWorkout } from "@/data/workouts"
import { redirect } from "next/navigation"

// Zod schema for set validation
const setSchema = z.object({
  setNumber: z.number().int().min(1, "Set number must be at least 1"),
  reps: z.number().int().min(1, "Reps must be at least 1").max(999, "Reps too high"),
  weight: z.number().min(0, "Weight cannot be negative").optional(),
  rir: z.number().int().min(0, "RIR cannot be negative").max(10, "RIR cannot exceed 10").optional(),
})

// Zod schema for exercise validation
const exerciseSchema = z.object({
  exerciseId: z.string().uuid("Invalid exercise ID"),
  order: z.number().int().min(0, "Order cannot be negative"),
  sets: z.array(setSchema).min(1, "At least one set is required"),
})

// Zod schema for workout validation
const createWorkoutSchema = z.object({
  name: z.string().max(100, "Name too long").optional(),
  date: z.string().datetime("Invalid date format"),
  exercises: z.array(exerciseSchema).min(1, "At least one exercise is required"),
})

// TypeScript type from schema
export type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>

// Response type
export type ActionResult<T> =
  | { success: true; data: T }
  | {
      success: false
      error: string
      code?: "UNAUTHORIZED" | "VALIDATION_ERROR" | "SERVER_ERROR"
      details?: unknown
    }

/**
 * Server Action to create a new workout
 * CRITICAL: Authenticates user and validates all input
 */
export async function createWorkoutAction(
  input: CreateWorkoutInput
): Promise<ActionResult<{ workoutId: string }>> {
  try {
    // 1. Authenticate user
    const { userId } = await auth()

    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      }
    }

    // 2. Validate input with Zod
    const validatedData = createWorkoutSchema.parse(input)

    // 3. Call data helper function
    const workout = await createWorkout(userId, {
      name: validatedData.name,
      date: new Date(validatedData.date),
      exercises: validatedData.exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        order: ex.order,
        sets: ex.sets.map((set) => ({
          setNumber: set.setNumber,
          reps: set.reps,
          weight: set.weight,
          rir: set.rir,
        })),
      })),
    })

    // 4. Revalidate affected paths
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/workout")

    // 5. Return success response
    return {
      success: true,
      data: { workoutId: workout.id },
    }
  } catch (error) {
    // 6. Handle errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid input",
        code: "VALIDATION_ERROR",
        details: error.flatten().fieldErrors,
      }
    }

    console.error("Failed to create workout:", error)
    return {
      success: false,
      error: "Failed to create workout",
      code: "SERVER_ERROR",
    }
  }
}
