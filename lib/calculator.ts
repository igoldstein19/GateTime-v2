import { getTimeBucket } from './timeBuckets'
import { getSeedEstimate } from './data/seedEstimates'
import { getWalkTime } from './data/walkTimes'
import { getAirlineById } from './data/airlines'
import type { TimeBucket } from './types'

export interface CalcResult {
  arriveBy: Date
  terminalCode: string
  terminalName: string
  breakdown: {
    flightTime: Date
    boardingBuffer: number
    walkMinutes: number
    securityMinutes: number
    checkInMinutes: number
    parkingBuffer: number
  }
}

export function calculateLeaveBy(
  flightTime: Date,
  airlineId: string,
  gate?: string,
): CalcResult | null {
  const airline = getAirlineById(airlineId)
  if (!airline) return null

  const boardingBuffer = airline.isInternational ? 45 : 30
  const parkingBuffer  = 10

  const walkMinutes = getWalkTime(airline.terminalId, gate)
  const gateArrival = new Date(flightTime.getTime() - boardingBuffer * 60_000)

  // Estimate airport arrival → determine which time bucket that falls in
  const roughSecurity = getSeedEstimate(airline.terminalId, 'security', getTimeBucket())
  const roughCheckIn  = getSeedEstimate(airline.terminalId, 'check_in', getTimeBucket())
  const estimatedArrival = new Date(
    gateArrival.getTime() - (walkMinutes + roughSecurity + roughCheckIn) * 60_000
  )
  const arrivalBucket: TimeBucket = getTimeBucket(estimatedArrival)

  const securityMinutes = getSeedEstimate(airline.terminalId, 'security', arrivalBucket)
  const checkInMinutes  = getSeedEstimate(airline.terminalId, 'check_in',  arrivalBucket)

  // arriveBy = airport arrival time (excludes parking buffer)
  const arriveByMs =
    flightTime.getTime() -
    (boardingBuffer + walkMinutes + securityMinutes + checkInMinutes) * 60_000

  return {
    arriveBy: new Date(arriveByMs),
    terminalCode: airline.terminalCode,
    terminalName: `Terminal ${airline.terminalCode}`,
    breakdown: { flightTime, boardingBuffer, walkMinutes, securityMinutes, checkInMinutes, parkingBuffer },
  }
}
