import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { getWorkoutById } from '@/data/workouts'
import { EditWorkoutForm } from './edit-workout-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default async function EditWorkoutPage({
  params,
}: {
  params: Promise<{ workoutId: string }>
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const { workoutId } = await params
  const workoutIdNumber = parseInt(workoutId, 10)

  if (isNaN(workoutIdNumber)) {
    notFound()
  }

  // Fetch the workout with security check (only returns if user owns it)
  const workout = await getWorkoutById(workoutIdNumber, userId)

  if (!workout) {
    notFound()
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit Workout</CardTitle>
          <CardDescription>
            Update your workout details below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditWorkoutForm workout={workout} />
        </CardContent>
      </Card>
    </div>
  )
}
