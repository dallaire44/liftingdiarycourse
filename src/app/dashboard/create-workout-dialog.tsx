'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createWorkout } from '@/app/actions/workouts'

export function CreateWorkoutDialog() {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)

    try {
      const result = await createWorkout(formData)

      if (result.success) {
        // Reset form before closing dialog
        formRef.current?.reset()
        setOpen(false)
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">Create New Workout</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form ref={formRef} onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Workout</DialogTitle>
            <DialogDescription>
              Start a new workout session. You can add exercises after creating it.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Workout Name <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Morning Leg Day"
                autoComplete="off"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="startedAt">
                Start Time <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="startedAt"
                name="startedAt"
                type="datetime-local"
                defaultValue={new Date().toISOString().slice(0, 16)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Workout'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
