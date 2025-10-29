"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createWorkoutAction } from "../actions"

type Exercise = {
  id: string
  name: string
  category: string | null
}

type Set = {
  setNumber: number
  reps: number
  weight: number | undefined
  rir: number | undefined
}

type WorkoutExercise = {
  exerciseId: string
  order: number
  sets: Set[]
}

interface WorkoutFormProps {
  exercises: Exercise[]
}

export function WorkoutForm({ exercises }: WorkoutFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [workoutName, setWorkoutName] = useState("")
  const [workoutDate, setWorkoutDate] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([])

  // Current exercise being added
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("")
  const [currentSets, setCurrentSets] = useState<Set[]>([
    { setNumber: 1, reps: 0, weight: undefined, rir: undefined }
  ])

  const addSetToCurrentExercise = () => {
    setCurrentSets([
      ...currentSets,
      {
        setNumber: currentSets.length + 1,
        reps: 0,
        weight: undefined,
        rir: undefined,
      },
    ])
  }

  const updateCurrentSet = (
    index: number,
    field: keyof Set,
    value: number | undefined
  ) => {
    const newSets = [...currentSets]
    newSets[index] = { ...newSets[index], [field]: value }
    setCurrentSets(newSets)
  }

  const removeSetFromCurrent = (index: number) => {
    setCurrentSets(currentSets.filter((_, i) => i !== index))
  }

  const addExerciseToWorkout = () => {
    if (!selectedExerciseId || currentSets.length === 0) {
      setError("Please select an exercise and add at least one set")
      return
    }

    // Validate that all sets have reps
    const hasInvalidSets = currentSets.some((set) => set.reps <= 0)
    if (hasInvalidSets) {
      setError("All sets must have reps greater than 0")
      return
    }

    setWorkoutExercises([
      ...workoutExercises,
      {
        exerciseId: selectedExerciseId,
        order: workoutExercises.length,
        sets: currentSets,
      },
    ])

    // Reset current exercise
    setSelectedExerciseId("")
    setCurrentSets([{ setNumber: 1, reps: 0, weight: undefined, rir: undefined }])
    setError(null)
  }

  const removeExerciseFromWorkout = (index: number) => {
    setWorkoutExercises(workoutExercises.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log("Form submitted")
    console.log("Workout exercises:", workoutExercises)

    if (workoutExercises.length === 0) {
      setError("Please add at least one exercise to the workout")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Convert date to ISO datetime string
      const dateTime = new Date(workoutDate)
      dateTime.setHours(12, 0, 0, 0) // Set to noon to avoid timezone issues

      const payload = {
        name: workoutName || undefined,
        date: dateTime.toISOString(),
        exercises: workoutExercises,
      }

      console.log("Submitting payload:", payload)

      const result = await createWorkoutAction(payload)

      console.log("Result:", result)

      if (result.success) {
        // Redirect to dashboard
        router.push("/dashboard")
        router.refresh()
      } else {
        setError(result.error)
        console.error("Action error:", result)
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error("Exception:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const getExerciseName = (exerciseId: string) => {
    return exercises.find((ex) => ex.id === exerciseId)?.name || "Unknown"
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Workout Details */}
      <Card>
        <CardHeader>
          <CardTitle>Workout Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="workoutName">Workout Name (Optional)</Label>
            <Input
              id="workoutName"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              placeholder="e.g., Leg Day"
            />
          </div>
          <div>
            <Label htmlFor="workoutDate">Date</Label>
            <Input
              id="workoutDate"
              type="date"
              value={workoutDate}
              onChange={(e) => setWorkoutDate(e.target.value)}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Add Exercise */}
      <Card>
        <CardHeader>
          <CardTitle>Add Exercise</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="exerciseSelect">Select Exercise</Label>
            {exercises.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-2">
                No exercises found. Please create exercises first.
              </p>
            ) : (
              <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
                <SelectTrigger id="exerciseSelect">
                  <SelectValue placeholder="Choose an exercise" />
                </SelectTrigger>
                <SelectContent>
                  {exercises.map((exercise) => (
                    <SelectItem key={exercise.id} value={exercise.id}>
                      {exercise.name}
                      {exercise.category && ` (${exercise.category})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Sets for current exercise */}
          {selectedExerciseId && (
            <div className="space-y-3">
              <Label>Sets</Label>
              {currentSets.map((set, index) => (
                <div
                  key={index}
                  className="grid grid-cols-5 gap-2 items-end"
                >
                  <div>
                    <Label htmlFor={`set-${index}`} className="text-xs">
                      Set
                    </Label>
                    <Input
                      id={`set-${index}`}
                      type="number"
                      value={set.setNumber}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`reps-${index}`} className="text-xs">
                      Reps
                    </Label>
                    <Input
                      id={`reps-${index}`}
                      type="number"
                      min="1"
                      value={set.reps || ""}
                      onChange={(e) =>
                        updateCurrentSet(index, "reps", parseInt(e.target.value) || 0)
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor={`weight-${index}`} className="text-xs">
                      Weight (lbs)
                    </Label>
                    <Input
                      id={`weight-${index}`}
                      type="number"
                      step="0.5"
                      min="0"
                      value={set.weight ?? ""}
                      onChange={(e) =>
                        updateCurrentSet(
                          index,
                          "weight",
                          e.target.value ? parseFloat(e.target.value) : undefined
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor={`rir-${index}`} className="text-xs">
                      RIR
                    </Label>
                    <Input
                      id={`rir-${index}`}
                      type="number"
                      min="0"
                      max="10"
                      value={set.rir ?? ""}
                      onChange={(e) =>
                        updateCurrentSet(
                          index,
                          "rir",
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeSetFromCurrent(index)}
                    disabled={currentSets.length === 1}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addSetToCurrentExercise}
                >
                  Add Set
                </Button>
                <Button
                  type="button"
                  onClick={addExerciseToWorkout}
                >
                  Add Exercise to Workout
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workout Summary */}
      {workoutExercises.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Workout Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {workoutExercises.map((exercise, exerciseIndex) => (
              <div key={exerciseIndex} className="border-b pb-4 last:border-b-0">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">
                    {getExerciseName(exercise.exerciseId)}
                  </h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExerciseFromWorkout(exerciseIndex)}
                  >
                    Remove
                  </Button>
                </div>
                <div className="space-y-2">
                  {exercise.sets.map((set, setIndex) => (
                    <div
                      key={setIndex}
                      className="grid grid-cols-4 gap-2 text-sm bg-muted/50 p-2 rounded"
                    >
                      <div>
                        <p className="text-muted-foreground">Set {set.setNumber}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Reps: {set.reps}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">
                          Weight: {set.weight ?? "-"} lbs
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">RIR: {set.rir ?? "-"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard")}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || workoutExercises.length === 0}>
          {isLoading ? "Saving..." : "Save Workout"}
        </Button>
      </div>
    </form>
  )
}
