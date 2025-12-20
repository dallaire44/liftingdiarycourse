'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

  useEffect(() => {
    setSelectedDate(new Date())
  }, [])

  // Mock workout data - this will be replaced with real data later
  const mockWorkouts = [
    {
      id: 1,
      exercise: 'Bench Press',
      sets: 3,
      reps: 10,
      weight: '185 lbs'
    },
    {
      id: 2,
      exercise: 'Squats',
      sets: 4,
      reps: 8,
      weight: '225 lbs'
    },
    {
      id: 3,
      exercise: 'Deadlifts',
      sets: 3,
      reps: 5,
      weight: '315 lbs'
    }
  ]

  const formattedDate = selectedDate ? format(selectedDate, 'do MMM yyyy') : 'Select a date'

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Track your workouts and progress
        </p>
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
              onSelect={(date) => date && setSelectedDate(date)}
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
            {mockWorkouts.length > 0 ? (
              <div className="space-y-4">
                {mockWorkouts.map((workout) => (
                  <Card key={workout.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{workout.exercise}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-6 text-sm">
                        <div>
                          <span className="text-muted-foreground">Sets:</span>{' '}
                          <span className="font-medium">{workout.sets}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Reps:</span>{' '}
                          <span className="font-medium">{workout.reps}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Weight:</span>{' '}
                          <span className="font-medium">{workout.weight}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
