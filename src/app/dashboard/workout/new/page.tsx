import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { CreateWorkoutForm } from './create-workout-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default async function NewWorkoutPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Workout</CardTitle>
          <CardDescription>
            Start a new workout session. You can add exercises after creating it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateWorkoutForm />
        </CardContent>
      </Card>
    </div>
  )
}
