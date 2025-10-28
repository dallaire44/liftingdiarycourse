"use client"

import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter, useSearchParams } from "next/navigation"

export function DateSelector() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get date from URL or default to today
  const dateParam = searchParams.get("date")
  const selectedDate = dateParam
    ? new Date(dateParam + "T00:00:00") // Parse as local midnight, not UTC
    : new Date()

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return

    // Update URL with selected date
    const params = new URLSearchParams(searchParams)
    params.set("date", date.toISOString().split("T")[0])
    router.push(`/dashboard?${params.toString()}`)

    // Force server component to re-fetch data with new date
    router.refresh()
  }

  return (
    <Card>
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
          onSelect={handleDateSelect}
          className="rounded-md border"
        />
      </CardContent>
    </Card>
  )
}
