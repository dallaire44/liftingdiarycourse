'use client'

import { useState } from 'react'
import { format, startOfDay } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateWorkoutDialog } from './create-workout-dialog'

type WorkoutExerciseWithDetails = {
  id: number
  workoutId: number
  exerciseId: number
  order: number
  targetSets: number | null
  targetReps: number | null
  targetWeight: number | null
  createdAt: string
  exercise: {
    id: number
    name: string
    userId: string | null
    isCompound: number
    createdAt: string
    updatedAt: string
  }
  sets: {
    id: number
    workoutExerciseId: number
    setNumber: number
    reps: number
    weight: number | null
    rir: number | null
    tempo: string | null
    isWarmup: number
    isDropSet: number
    isFailure: number
    createdAt: string
    completedAt: string | null
  }[]
}

type WorkoutWithDetails = {
  id: number
  userId: string
  name: string | null
  startedAt: string
  completedAt: string | null
  createdAt: string
  updatedAt: string
  workoutExercises: WorkoutExerciseWithDetails[]
}

type DashboardClientProps = {
  workouts: WorkoutWithDetails[]
}

export function DashboardClient({ workouts }: DashboardClientProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(startOfDay(new Date()))

  // Filter workouts for the selected date
  const filteredWorkouts = selectedDate
    ? workouts.filter((workout) => {
        const workoutDate = startOfDay(new Date(workout.startedAt))
        const selectedDay = startOfDay(selectedDate)
        return workoutDate.getTime() === selectedDay.getTime()
      })
    : []

  const formattedDate = selectedDate ? format(selectedDate, 'do MMM yyyy') : 'Select a date'

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Track your workouts and progress
          </p>
        </div>
        <CreateWorkoutDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Date Picker Section */}
        <Card>
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
            <CardDescription>Choose a date to view workouts</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(startOfDay(date))}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Workouts List Section */}
        <Card>
          <CardHeader>
            <CardTitle>Workouts</CardTitle>
            <CardDescription>
              {selectedDate ? (
                <time dateTime={selectedDate.toISOString()}>
                  {formattedDate}
                </time>
              ) : (
                <span>{formattedDate}</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredWorkouts.length > 0 ? (
              <div className="space-y-4">
                {filteredWorkouts.map((workout) => (
                  <div key={workout.id} className="space-y-3">
                    {workout.name && (
                      <h3 className="font-semibold text-lg">{workout.name}</h3>
                    )}
                    {workout.workoutExercises.map((workoutExercise) => {
                      // Calculate totals from actual sets
                      const totalSets = workoutExercise.sets.length
                      const totalReps = workoutExercise.sets.reduce(
                        (sum, set) => sum + set.reps,
                        0
                      )
                      const avgWeight = workoutExercise.sets.length > 0
                        ? workoutExercise.sets.reduce(
                            (sum, set) => sum + (set.weight || 0),
                            0
                          ) / workoutExercise.sets.length
                        : 0

                      return (
                        <Card key={workoutExercise.id}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg">
                              {workoutExercise.exercise.name}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex gap-6 text-sm">
                              <div>
                                <span className="text-muted-foreground">Sets:</span>{' '}
                                <span className="font-medium">{totalSets}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Total Reps:</span>{' '}
                                <span className="font-medium">{totalReps}</span>
                              </div>
                              {avgWeight > 0 && (
                                <div>
                                  <span className="text-muted-foreground">Avg Weight:</span>{' '}
                                  <span className="font-medium">{avgWeight.toFixed(1)} lbs</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No workouts logged for this date
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
