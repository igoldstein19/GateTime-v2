import type { SeedEstimate, TimeBucket } from '../types'

// Seed averages per terminal / segment / time-bucket (same for all 7 days)
const SEED: {
  terminalId: string
  buckets: Record<TimeBucket, { check_in: number; security: number }>
}[] = [
  {
    terminalId: 'term-a',
    buckets: {
      early_morning: { check_in: 8,  security: 8  },
      morning:       { check_in: 15, security: 20 },
      midday:        { check_in: 10, security: 12 },
      afternoon:     { check_in: 15, security: 18 },
      evening:       { check_in: 12, security: 15 },
    },
  },
  {
    terminalId: 'term-b',
    buckets: {
      early_morning: { check_in: 10, security: 10 },
      morning:       { check_in: 18, security: 25 },
      midday:        { check_in: 12, security: 15 },
      afternoon:     { check_in: 18, security: 22 },
      evening:       { check_in: 14, security: 18 },
    },
  },
  {
    terminalId: 'term-c',
    buckets: {
      early_morning: { check_in: 8,  security: 10 },
      morning:       { check_in: 15, security: 22 },
      midday:        { check_in: 10, security: 14 },
      afternoon:     { check_in: 15, security: 20 },
      evening:       { check_in: 12, security: 16 },
    },
  },
  {
    terminalId: 'term-e',
    buckets: {
      early_morning: { check_in: 12, security: 12 },
      morning:       { check_in: 20, security: 25 },
      midday:        { check_in: 15, security: 15 },
      afternoon:     { check_in: 22, security: 25 },
      evening:       { check_in: 18, security: 20 },
    },
  },
]

// Lounge fixed at 20 min regardless of terminal/bucket
export const LOUNGE_MINUTES = 20

export function getSeedEstimate(terminalId: string, segment: 'check_in' | 'security', timeBucket: TimeBucket): number {
  const entry = SEED.find(s => s.terminalId === terminalId)
  if (!entry) return 10
  return entry.buckets[timeBucket][segment]
}

export const PEAK_TIPS: Record<string, string> = {
  'term-a': 'Typically busiest 7–10am on weekdays — Delta morning banks are heavy.',
  'term-b': 'Busiest terminal at BOS. Arrive extra early 7–10am and 2–5pm.',
  'term-c': 'JetBlue morning rush peaks 6–9am. PreCheck line usually moves faster.',
  'term-e': 'International check-in often opens 3h before departure. Arrive early.',
}
