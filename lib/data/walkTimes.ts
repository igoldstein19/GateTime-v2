import type { WalkTime } from '../types'

export const WALK_TIMES: WalkTime[] = [
  { terminalId: 'term-a', gateArea: 'Main',      gatePrefix: 'A1-A11',   walkMinutes: 4 },
  { terminalId: 'term-a', gateArea: 'Satellite', gatePrefix: 'A13-A22',  walkMinutes: 8 },
  { terminalId: 'term-b', gateArea: 'North',     gatePrefix: 'B21-B38',  walkMinutes: 6 },
  { terminalId: 'term-b', gateArea: 'South',     gatePrefix: 'B1-B14',   walkMinutes: 5 },
  { terminalId: 'term-c', gateArea: 'All',       gatePrefix: 'C1-C42',   walkMinutes: 5 },
  { terminalId: 'term-e', gateArea: 'Near',      gatePrefix: 'E1-E5',    walkMinutes: 4 },
  { terminalId: 'term-e', gateArea: 'Far',       gatePrefix: 'E6-E12',   walkMinutes: 7 },
]

/** Parse gate number from string like "B32" → 32 */
function parseGateNumber(gate: string): { prefix: string; num: number } | null {
  const m = gate.trim().toUpperCase().match(/^([A-Z]+)(\d+)$/)
  if (!m) return null
  return { prefix: m[1], num: parseInt(m[2]) }
}

/** Parse range like "B21-B38" → { prefix: "B", lo: 21, hi: 38 } */
function parseRange(range: string) {
  const parts = range.split('-')
  if (parts.length !== 2) return null
  const lo = parseGateNumber(parts[0])
  const hi = parseGateNumber(parts[1])
  if (!lo || !hi) return null
  return { prefix: lo.prefix, lo: lo.num, hi: hi.num }
}

export function getWalkTime(terminalId: string, gate?: string): number {
  const rows = WALK_TIMES.filter(w => w.terminalId === terminalId)
  if (!gate) {
    const avg = rows.reduce((s, r) => s + r.walkMinutes, 0) / rows.length
    return Math.round(avg)
  }
  const parsed = parseGateNumber(gate)
  if (parsed) {
    for (const row of rows) {
      const range = parseRange(row.gatePrefix)
      if (range && range.prefix === parsed.prefix && parsed.num >= range.lo && parsed.num <= range.hi) {
        return row.walkMinutes
      }
    }
  }
  // fallback to average
  const avg = rows.reduce((s, r) => s + r.walkMinutes, 0) / rows.length
  return Math.round(avg)
}
