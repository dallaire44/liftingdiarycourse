import { format } from "date-fns"

/**
 * Get ordinal suffix for a day number (1st, 2nd, 3rd, 4th, etc.)
 */
export function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return "th"
  switch (day % 10) {
    case 1: return "st"
    case 2: return "nd"
    case 3: return "rd"
    default: return "th"
  }
}

/**
 * Format a date in the standard project format: "1st Sep 2025"
 */
export function formatStandardDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const day = format(dateObj, "d")
  const suffix = getOrdinalSuffix(parseInt(day))
  const monthYear = format(dateObj, "MMM yyyy")
  return `${day}${suffix} ${monthYear}`
}
