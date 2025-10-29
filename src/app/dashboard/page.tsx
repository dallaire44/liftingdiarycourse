import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatStandardDate } from "@/lib/date-utils"
import { getWorkoutsByUserIdAndDate } from "@/data/workouts"
import { DateSelector } from "./_components/date-selector"

interface DashboardPageProps {
  searchParams: Promise<{ date?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  // 1. Get authenticated user
  const { userId } = await auth()

  // 2. Redirect if not authenticated
  if (!userId) {
    redirect("/sign-in")
  }

  // 3. Get selected date from URL params or default to today
  const params = await searchParams
  const dateParam = params.date
  const selectedDate = dateParam
    ? new Date(dateParam + "T00:00:00") // Parse as local midnight, not UTC
    : new Date()

  // 4. Fetch workouts for the selected date using data layer
  const workoutsData = await getWorkoutsByUserIdAndDate(userId, selectedDate)

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
        <div className="lg:col-span-1">
          <DateSelector />
        </div>

        {/* Workouts List Section */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workouts for {formatStandardDate(selectedDate)}</CardTitle>
              <CardDescription>
                {workoutsData.length} workout{workoutsData.length !== 1 ? "s" : ""} logged
              </CardDescription>
            </CardHeader>
          </Card>

          {workoutsData.length > 0 ? (
            <div className="space-y-4">
              {workoutsData.map((workout) => (
                <Link key={workout.id} href={`/dashboard/workout/${workout.id}`}>
                  <Card className="cursor-pointer transition-colors hover:bg-accent">
                    <CardHeader>
                      <CardTitle className="text-xl">
                        {workout.name || "Untitled Workout"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {workout.exercises.map((exercise) => (
                          <div key={exercise.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                            <h3 className="font-semibold text-lg mb-3">{exercise.exerciseName}</h3>
                            {exercise.sets.length > 0 ? (
                              <div className="space-y-2">
                                {exercise.sets.map((set) => (
                                  <div
                                    key={set.id}
                                    className="grid grid-cols-4 gap-4 text-sm bg-muted/50 p-3 rounded-md"
                                  >
                                    <div>
                                      <p className="text-muted-foreground">Set</p>
                                      <p className="font-medium">{set.setNumber}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Reps</p>
                                      <p className="font-medium">{set.reps}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Weight (lbs)</p>
                                      <p className="font-medium">
                                        {set.weight ? Number(set.weight).toFixed(1) : "-"}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">RIR</p>
                                      <p className="font-medium">{set.rir ?? "-"}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No sets recorded</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
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
