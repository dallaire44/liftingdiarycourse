import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getUserWorkouts } from '@/data/workouts'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Fetch workouts for the logged-in user
  // SECURITY: Only fetches workouts belonging to this user
  const workouts = await getUserWorkouts(userId)

  // Serialize dates to ISO strings for client component
  // Next.js serializes Date objects to strings when crossing server/client boundary
  // We explicitly convert to ensure proper handling
  const serializedWorkouts = workouts.map((workout) => ({
    ...workout,
    startedAt: workout.startedAt.toISOString(),
    completedAt: workout.completedAt?.toISOString() ?? null,
    createdAt: workout.createdAt.toISOString(),
    updatedAt: workout.updatedAt.toISOString(),
    workoutExercises: workout.workoutExercises.map((we) => ({
      ...we,
      createdAt: we.createdAt.toISOString(),
      exercise: {
        ...we.exercise,
        createdAt: we.exercise.createdAt.toISOString(),
        updatedAt: we.exercise.updatedAt.toISOString(),
      },
      sets: we.sets.map((set) => ({
        ...set,
        createdAt: set.createdAt.toISOString(),
        completedAt: set.completedAt?.toISOString() ?? null,
      })),
    })),
  }))

  return <DashboardClient workouts={serializedWorkouts} />
}
