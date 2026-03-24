import type { TimeBucket } from './types'

export function getTimeBucket(date: Date = new Date()): TimeBucket {
  // Use local time (app targets BOS travelers who are physically there)
  const hour = date.getHours()
  if (hour >= 4  && hour < 7)  return 'early_morning'
  if (hour >= 7  && hour < 10) return 'morning'
  if (hour >= 10 && hour < 14) return 'midday'
  if (hour >= 14 && hour < 17) return 'afternoon'
  return 'evening'
}
