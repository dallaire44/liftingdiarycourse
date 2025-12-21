'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createWorkout } from '@/app/actions/workouts'

export function CreateWorkoutForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)

    try {
      const result = await createWorkout(formData)

      if (result.success) {
        // Redirect to the dashboard or the new workout page
        router.push('/dashboard')
        router.refresh()
      } else {
        console.error('Failed to create workout:', result.error)
        alert('Failed to create workout. Please try again.')
      }
    } catch (error) {
      console.error('Error creating workout:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">
          Workout Name <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g., Morning Leg Day"
          autoComplete="off"
        />
        <p className="text-sm text-muted-foreground">
          Give your workout a name to easily identify it later.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="startedAt">
          Start Time <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="startedAt"
          name="startedAt"
          type="datetime-local"
          defaultValue={new Date().toISOString().slice(0, 16)}
        />
        <p className="text-sm text-muted-foreground">
          Set when you started or will start this workout.
        </p>
      </div>

      <div className="flex gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Creating...' : 'Create Workout'}
        </Button>
      </div>
    </form>
  )
}
