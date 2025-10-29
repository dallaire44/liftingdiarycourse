import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getExercisesByUserId } from "@/data/exercises"
import { WorkoutForm } from "./_components/workout-form"

export default async function NewWorkoutPage() {
  // 1. Get authenticated user
  const { userId } = await auth()

  // 2. Redirect if not authenticated
  if (!userId) {
    redirect("/sign-in")
  }

  // 3. Fetch user's exercises for the form
  const exercises = await getExercisesByUserId(userId)

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Create New Workout</h1>
        <p className="text-muted-foreground">
          Log your workout with exercises, sets, reps, and weights
        </p>
      </div>

      <WorkoutForm exercises={exercises} />
    </div>
  )
}
