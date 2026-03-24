import type { SegmentEstimate, TerminalEstimate, SegmentType, TimeBucket } from './types'
import { getSeedEstimate, LOUNGE_MINUTES } from './data/seedEstimates'
import { getWalkTime } from './data/walkTimes'
import { getTimeBucket } from './timeBuckets'
import { getRecentReports } from './storage'

function weightedAvg(reports: { waitMinutes: number; reportedAt: string }[]): number {
  let weightSum = 0, valueSum = 0
  const now = Date.now()
  for (const r of reports) {
    const ageMin = (now - new Date(r.reportedAt).getTime()) / 60_000
    const w = Math.max(1, 121 - ageMin)
    weightSum += w
    valueSum  += w * r.waitMinutes
  }
  return Math.round(valueSum / weightSum)
}

export function getSegmentEstimate(
  terminalId: string,
  segment: SegmentType,
  timeBucket?: TimeBucket,
): SegmentEstimate {
  if (segment === 'lounge') {
    return { minutes: LOUNGE_MINUTES, isLive: false, liveCount: 0 }
  }
  const recent = getRecentReports(terminalId, segment, 2)
  if (recent.length >= 2) {
    return { minutes: weightedAvg(recent), isLive: true, liveCount: recent.length }
  }
  const bucket = timeBucket ?? getTimeBucket()
  return { minutes: getSeedEstimate(terminalId, segment as 'check_in' | 'security', bucket), isLive: false, liveCount: 0 }
}

export function getTerminalEstimate(
  terminalId: string,
  gate?: string,
  includeLounge = false,
  timeBucket?: TimeBucket,
): TerminalEstimate {
  const checkIn  = getSegmentEstimate(terminalId, 'check_in', timeBucket)
  const security = getSegmentEstimate(terminalId, 'security', timeBucket)
  const lounge   = getSegmentEstimate(terminalId, 'lounge',   timeBucket)
  const walk     = getWalkTime(terminalId, gate)

  const total = checkIn.minutes + security.minutes + walk + (includeLounge ? lounge.minutes : 0)
  const liveReports = checkIn.liveCount + security.liveCount

  return {
    check_in: checkIn,
    security,
    lounge,
    walk,
    totalMinutes: total,
    hasLiveData: checkIn.isLive || security.isLive,
    totalLiveReports: liveReports,
  }
}
