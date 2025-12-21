'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { workouts } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

/**
 * Creates a new workout for the authenticated user.
 *
 * SECURITY: Automatically sets userId from authenticated session.
 * Users can only create workouts for themselves.
 */
export async function createWorkout(formData: FormData) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  const name = formData.get('name') as string
  const startedAtString = formData.get('startedAt') as string

  // Parse the date or use current time
  const startedAt = startedAtString
    ? new Date(startedAtString)
    : new Date()

  try {
    // Insert the workout with the authenticated user's ID
    const [newWorkout] = await db
      .insert(workouts)
      .values({
        userId, // CRITICAL: Set userId from authenticated session
        name: name || null,
        startedAt,
        completedAt: null, // New workout is not completed yet
      })
      .returning()

    // Revalidate the dashboard to show the new workout
    revalidatePath('/dashboard')

    return { success: true, workout: newWorkout }
  } catch (error) {
    console.error('Error creating workout:', error)
    return { success: false, error: 'Failed to create workout' }
  }
}

/**
 * Deletes a workout for the authenticated user.
 *
 * SECURITY: Verifies ownership before deletion.
 * Users can only delete their own workouts.
 */
export async function deleteWorkout(workoutId: number) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    // CRITICAL: Only delete if the workout belongs to the user
    await db
      .delete(workouts)
      .where(
        and(
          eq(workouts.id, workoutId),
          eq(workouts.userId, userId)
        )
      )

    // Revalidate the dashboard
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Error deleting workout:', error)
    return { success: false, error: 'Failed to delete workout' }
  }
}

/**
 * Completes a workout by setting the completedAt timestamp.
 *
 * SECURITY: Verifies ownership before updating.
 */
export async function completeWorkout(workoutId: number) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    // CRITICAL: Only update if the workout belongs to the user
    const [updatedWorkout] = await db
      .update(workouts)
      .set({
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(workouts.id, workoutId),
          eq(workouts.userId, userId)
        )
      )
      .returning()

    if (!updatedWorkout) {
      return { success: false, error: 'Workout not found or unauthorized' }
    }

    // Revalidate the dashboard
    revalidatePath('/dashboard')

    return { success: true, workout: updatedWorkout }
  } catch (error) {
    console.error('Error completing workout:', error)
    return { success: false, error: 'Failed to complete workout' }
  }
}
