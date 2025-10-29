import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getWorkoutByIdAndUserId } from "@/data/workouts"
import { getExercisesByUserId } from "@/data/exercises"
import { EditWorkoutForm } from "./_components/edit-workout-form"

interface EditWorkoutPageProps {
  params: Promise<{
    workoutId: string
  }>
}

export default async function EditWorkoutPage({ params }: EditWorkoutPageProps) {
  // 1. Get authenticated user
  const { userId } = await auth()

  // 2. Redirect if not authenticated
  if (!userId) {
    redirect("/sign-in")
  }

  // 3. Await params (Next.js 15+ requirement)
  const { workoutId } = await params

  // 4. Fetch the workout (scoped to user for security)
  const workout = await getWorkoutByIdAndUserId(userId, workoutId)

  // 5. Redirect if workout not found or doesn't belong to user
  if (!workout) {
    redirect("/dashboard")
  }

  // 6. Fetch user's exercises for the form
  const exercises = await getExercisesByUserId(userId)

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Edit Workout</h1>
        <p className="text-muted-foreground">
          Update your workout details, exercises, sets, reps, and weights
        </p>
      </div>

      <EditWorkoutForm workout={workout} exercises={exercises} />
    </div>
  )
}
