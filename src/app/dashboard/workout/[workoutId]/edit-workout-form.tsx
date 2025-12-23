'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateWorkout } from '@/app/actions/workouts'
import type { Workout } from '@/db/schema'

interface EditWorkoutFormProps {
  workout: Workout
}

export function EditWorkoutForm({ workout }: EditWorkoutFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)

    try {
      const result = await updateWorkout({
        workoutId: workout.id,
        name: formData.get('name') as string || null,
        startedAt: formData.get('startedAt')
          ? new Date(formData.get('startedAt') as string)
          : undefined,
        completedAt: formData.get('completedAt')
          ? new Date(formData.get('completedAt') as string)
          : null,
      })

      if (result.success) {
        // Redirect to the dashboard after successful update
        router.push('/dashboard')
        router.refresh()
      } else {
        console.error('Failed to update workout:', result.error)
        alert(result.error || 'Failed to update workout. Please try again.')
      }
    } catch (error) {
      console.error('Error updating workout:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format date for datetime-local input
  const formatDateForInput = (date: Date | null) => {
    if (!date) return ''
    return new Date(date).toISOString().slice(0, 16)
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
          defaultValue={workout.name || ''}
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
          defaultValue={formatDateForInput(workout.startedAt)}
        />
        <p className="text-sm text-muted-foreground">
          Set when you started this workout.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="completedAt">
          Completion Time <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="completedAt"
          name="completedAt"
          type="datetime-local"
          defaultValue={formatDateForInput(workout.completedAt)}
        />
        <p className="text-sm text-muted-foreground">
          Set when you completed this workout. Leave blank if still in progress.
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
          {isSubmitting ? 'Updating...' : 'Update Workout'}
        </Button>
      </div>
    </form>
  )
}
