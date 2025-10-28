"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatStandardDate } from "@/lib/date-utils"

// Mock workout data for UI demonstration
const mockWorkouts = [
  {
    id: 1,
    name: "Bench Press",
    sets: 4,
    reps: 8,
    weight: 225,
  },
  {
    id: 2,
    name: "Squats",
    sets: 5,
    reps: 5,
    weight: 315,
  },
  {
    id: 3,
    name: "Deadlift",
    sets: 3,
    reps: 6,
    weight: 405,
  },
  {
    id: 4,
    name: "Overhead Press",
    sets: 4,
    reps: 10,
    weight: 135,
  },
]

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Workout Dashboard</h1>
        <p className="text-muted-foreground">
          Track your lifting progress and view your workout history
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Date Picker Section */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
            <CardDescription>
              Choose a date to view workouts
            </CardDescription>
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
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workouts for {formatStandardDate(selectedDate)}</CardTitle>
              <CardDescription>
                {mockWorkouts.length} exercise{mockWorkouts.length !== 1 ? "s" : ""} logged
              </CardDescription>
            </CardHeader>
          </Card>

          {mockWorkouts.length > 0 ? (
            <div className="space-y-4">
              {mockWorkouts.map((workout) => (
                <Card key={workout.id}>
                  <CardHeader>
                    <CardTitle className="text-xl">{workout.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Sets</p>
                        <p className="text-2xl font-bold">{workout.sets}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Reps</p>
                        <p className="text-2xl font-bold">{workout.reps}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Weight (lbs)</p>
                        <p className="text-2xl font-bold">{workout.weight}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  No workouts logged for this date
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
