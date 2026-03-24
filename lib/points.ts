import type { Reporter, SegmentType } from './types'
import { getRecentReports } from './storage'

export interface PointsResult {
  total: number
  bonuses: string[]
}

export function calculatePoints(
  terminalId: string,
  segments: SegmentType[],
  reporter: Reporter | null,
): PointsResult {
  let points = 10
  const bonuses: string[] = ['+10 Base']

  // Peak hour bonus (7-10am or 2-5pm)
  const hour = new Date().getHours()
  if ((hour >= 7 && hour < 10) || (hour >= 14 && hour < 17)) {
    points += 5
    bonuses.push('+5 Peak Hour')
  }

  // Trailblazer — first report for this terminal+segment in last 3h
  // Check each reported segment; award if ANY segment is a trailblazer
  const isTrailblazer = segments.some(seg => {
    const recent3h = getRecentReports(terminalId, seg, 3)
    return recent3h.length === 0
  })
  if (isTrailblazer) {
    points += 10
    bonuses.push('+10 Trailblazer')
  }

  // Multi-segment bonus
  if (segments.length >= 2) {
    points += 5
    bonuses.push('+5 Multi-segment')
  }

  // Streak bonus
  const streak = reporter?.currentStreak ?? 0
  if (streak >= 7)      { points += 25; bonuses.push('+25 Streak (7+ days)') }
  else if (streak >= 5) { points += 15; bonuses.push('+15 Streak (5+ days)') }
  else if (streak >= 3) { points += 10; bonuses.push('+10 Streak (3+ days)') }
  else if (streak >= 2) { points += 5;  bonuses.push('+5 Streak (2 days)')   }

  return { total: points, bonuses }
}
