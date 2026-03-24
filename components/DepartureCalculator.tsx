'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plane, ChevronDown, Car, MapPin, Loader2 } from 'lucide-react'
import { AIRLINES, DOMESTIC_AIRLINES, INTERNATIONAL_AIRLINES } from '../lib/data/airlines'
import { calculateLeaveBy } from '../lib/calculator'
import { format } from 'date-fns'
import type { DriveTimeResult } from '../lib/driveTime'

function formatTime(d: Date) {
  return format(d, 'h:mm a')
}

export default function DepartureCalculator() {
  const router = useRouter()
  const [airlineId, setAirlineId] = useState('')
  const [flightHour, setFlightHour] = useState('8')
  const [flightMin, setFlightMin]   = useState('00')
  const [ampm, setAmpm]             = useState<'AM' | 'PM'>('AM')
  const [gate, setGate]             = useState('')
  const [address, setAddress]       = useState('')
  const [driveResult, setDriveResult] = useState<DriveTimeResult | null>(null)
  const [driveLoading, setDriveLoading] = useState(false)
  const [driveError, setDriveError] = useState('')
  const [result, setResult] = useState<ReturnType<typeof calculateLeaveBy>>(null)

  const airline = AIRLINES.find(a => a.id === airlineId)

  const calculate = async () => {
    if (!airlineId) return
    const now   = new Date()
    let h = parseInt(flightHour) % 12
    if (ampm === 'PM') h += 12
    const flight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, parseInt(flightMin))
    if (flight < now) flight.setDate(flight.getDate() + 1)
    const r = calculateLeaveBy(flight, airlineId, gate || undefined)
    setResult(r)

    // If address provided, fetch drive time
    if (address.trim()) {
      setDriveLoading(true)
      setDriveError('')
      setDriveResult(null)
      try {
        const params = new URLSearchParams({ origin: address.trim(), airport: 'BOS' })
        if (r) {
          params.set('departureTime', r.arriveBy.toISOString())
        }
        const res = await fetch(`/api/drive-time?${params}`)
        if (res.ok) {
          const data: DriveTimeResult = await res.json()
          setDriveResult(data)
        } else {
          const body = await res.json().catch(() => ({}))
          if (res.status === 503) {
            // API not configured — fail silently
            setDriveResult(null)
          } else {
            setDriveError(body.detail || 'Could not calculate drive time')
          }
        }
      } catch {
        setDriveError('Network error fetching drive time')
      } finally {
        setDriveLoading(false)
      }
    } else {
      setDriveResult(null)
    }
  }

  // Compute "leave home by" if we have both results
  const leaveHomeBy = result && driveResult
    ? new Date(result.arriveBy.getTime() - driveResult.durationInTrafficMinutes * 60_000)
    : null

  return (
    <div className="card p-6 lg:p-8 animate-slide-up">
      <div className="flex items-center gap-2 mb-5">
        <Plane size={16} className="text-[#34D399]" />
        <span className="text-sm font-bold text-[#1A1A2E]">When should I leave?</span>
      </div>

      <div className="space-y-4">
        {/* Airline selector */}
        <div>
          <label className="block text-[11px] text-[#6B7280] font-medium uppercase tracking-wider mb-1.5">Airline</label>
          <div className="relative">
            <select
              value={airlineId}
              onChange={e => { setAirlineId(e.target.value); setResult(null); setDriveResult(null) }}
              className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 font-medium appearance-none focus:outline-none focus:border-[#34D399] focus:ring-1 focus:ring-[#34D399]/20 transition-colors"
            >
              <option value="">Select your airline…</option>
              <optgroup label="── Domestic ──">
                {DOMESTIC_AIRLINES.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </optgroup>
              <optgroup label="── International ──">
                {INTERNATIONAL_AIRLINES.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </optgroup>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          {airline && (
            <p className="text-[11px] text-[#34D399] mt-1.5 font-semibold">
              → Terminal {airline.terminalCode}{airline.isInternational ? ' (International)' : ''}
            </p>
          )}
        </div>

        {/* Flight time */}
        <div>
          <label className="block text-[11px] text-[#6B7280] font-medium uppercase tracking-wider mb-1.5">Flight Time</label>
          <div className="flex gap-2">
            <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden flex-1">
              <select
                value={flightHour}
                onChange={e => setFlightHour(e.target.value)}
                className="bg-transparent px-3 py-2.5 text-sm text-gray-900 font-mono font-bold appearance-none focus:outline-none w-14 text-center"
              >
                {Array.from({length: 12}, (_, i) => i + 1).map(h => (
                  <option key={h} value={String(h)}>{String(h).padStart(2, '0')}</option>
                ))}
              </select>
              <span className="text-gray-400 font-mono font-bold">:</span>
              <select
                value={flightMin}
                onChange={e => setFlightMin(e.target.value)}
                className="bg-transparent px-3 py-2.5 text-sm text-gray-900 font-mono font-bold appearance-none focus:outline-none w-14 text-center"
              >
                {['00','05','10','15','20','25','30','35','40','45','50','55'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setAmpm(v => v === 'AM' ? 'PM' : 'AM')}
              className="num bg-white border border-gray-200 rounded-xl px-4 text-sm font-bold text-[#0A0F1E] hover:border-[#34D399]/40 transition-colors"
            >
              {ampm}
            </button>
          </div>
        </div>

        {/* Two-column: Gate + Address */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-[#6B7280] font-medium uppercase tracking-wider mb-1.5">
              Gate <span className="text-gray-400 normal-case tracking-normal font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={gate}
              onChange={e => setGate(e.target.value)}
              placeholder="e.g. B32"
              maxLength={8}
              className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-mono text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#34D399] focus:ring-1 focus:ring-[#34D399]/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#6B7280] font-medium uppercase tracking-wider mb-1.5">
              Your location <span className="text-gray-400 normal-case tracking-normal font-normal">(optional)</span>
            </label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="e.g. Cambridge, MA"
                className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#34D399] focus:ring-1 focus:ring-[#34D399]/20 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Calculate button */}
        <button
          onClick={calculate}
          disabled={!airlineId}
          className="w-full py-3 bg-[#34D399] hover:bg-[#2ec48d] disabled:opacity-30 disabled:cursor-not-allowed text-[#0A0F1E] font-bold text-sm rounded-xl transition-colors"
        >
          Calculate
        </button>
      </div>

      {/* Result + Timeline on dark card */}
      {result && (
        <div className="mt-5 bg-[#0A0F1E] rounded-2xl p-5 lg:p-6 animate-slide-up">
          {/* Hero time */}
          {leaveHomeBy ? (
            <>
              <p className="text-[10px] text-[#34D399] uppercase tracking-widest font-bold mb-1">Leave home by</p>
              <div className="num text-4xl lg:text-5xl font-bold text-white leading-none mb-1">
                {formatTime(leaveHomeBy)}
              </div>
              <p className="text-xs text-white/50 mb-1">
                Arrive at airport by {formatTime(result.arriveBy)}
              </p>
            </>
          ) : (
            <>
              <p className="text-[10px] text-[#34D399] uppercase tracking-widest font-bold mb-1">Arrive at airport by</p>
              <div className="num text-4xl lg:text-5xl font-bold text-white leading-none mb-2">
                {formatTime(result.arriveBy)}
              </div>
            </>
          )}
          <p className="text-sm text-white/60 mb-6">
            Terminal {result.terminalCode} · {airline?.name}
          </p>

          {/* Vertical timeline */}
          <div className="relative pl-8 space-y-0">
            {/* Leave home — only if drive time available */}
            {driveResult && leaveHomeBy && (
              <div className="relative pb-5">
                <div className="absolute left-[-20px] top-[3px] w-4 h-4 rounded-full bg-[#0A0F1E] border-2 border-[#34D399] z-10" />
                <div className="absolute left-[-13px] top-[19px] bottom-0 w-px bg-white/15" />
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-bold text-white">Leave home</span>
                  <span className="num text-lg font-bold text-white">{formatTime(leaveHomeBy)}</span>
                </div>
              </div>
            )}

            {/* Drive to airport — only if drive time */}
            {driveResult && (
              <div className="relative pb-5">
                <div className="absolute left-[-20px] top-[3px] w-3 h-3 rounded-full bg-[#0A0F1E] border-2 border-[#60A5FA] z-10 mt-0.5" />
                <div className="absolute left-[-13px] top-[19px] bottom-0 w-px bg-white/15" />
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="text-sm text-white/70">Drive to Logan</span>
                    <span className="text-[10px] text-white/40 ml-2">{driveResult.distanceMiles} mi</span>
                  </div>
                  <span className="num text-base font-semibold text-white">{driveResult.durationInTrafficMinutes} min</span>
                </div>
              </div>
            )}

            {/* Arrive at airport — top node */}
            <div className="relative pb-5">
              <div className={`absolute left-[-20px] top-[3px] ${driveResult ? 'w-3 h-3 mt-0.5' : 'w-4 h-4'} rounded-full bg-[#0A0F1E] border-2 border-white z-10`} />
              <div className="absolute left-[-13px] top-[19px] bottom-0 w-px bg-white/15" />
              <div className="flex justify-between items-baseline">
                <span className={`text-sm ${driveResult ? 'text-white/70' : 'font-bold text-white'}`}>Arrive at airport</span>
                <span className={`num ${driveResult ? 'text-base font-semibold' : 'text-lg font-bold'} text-white`}>{formatTime(result.arriveBy)}</span>
              </div>
            </div>

            {/* Check-in */}
            <div className="relative pb-5">
              <div className="absolute left-[-20px] top-[3px] w-3 h-3 rounded-full bg-[#0A0F1E] border-2 border-[#3B82F6] z-10 mt-0.5" />
              <div className="absolute left-[-13px] top-[19px] bottom-0 w-px bg-white/15" />
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-white/70">Check-in</span>
                <span className="num text-base font-semibold text-white">{result.breakdown.checkInMinutes} min</span>
              </div>
            </div>

            {/* Security */}
            <div className="relative pb-5">
              <div className="absolute left-[-20px] top-[3px] w-3 h-3 rounded-full bg-[#0A0F1E] border-2 border-[#F59E0B] z-10 mt-0.5" />
              <div className="absolute left-[-13px] top-[19px] bottom-0 w-px bg-white/15" />
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-white/70">Security</span>
                <span className="num text-base font-semibold text-white">{result.breakdown.securityMinutes} min</span>
              </div>
            </div>

            {/* Walk to gate */}
            <div className="relative pb-5">
              <div className="absolute left-[-20px] top-[3px] w-3 h-3 rounded-full bg-[#0A0F1E] border-2 border-[#6B7280] z-10 mt-0.5" />
              <div className="absolute left-[-13px] top-[19px] bottom-0 w-px bg-white/15" />
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-white/70">Walk to gate</span>
                <span className="num text-base font-semibold text-white">{result.breakdown.walkMinutes} min</span>
              </div>
            </div>

            {/* Boarding */}
            <div className="relative pb-5">
              <div className="absolute left-[-20px] top-[3px] w-3 h-3 rounded-full bg-[#0A0F1E] border-2 border-[#34D399] z-10 mt-0.5" />
              <div className="absolute left-[-13px] top-[19px] bottom-0 w-px bg-white/15" />
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-white/70">Boarding</span>
                <span className="num text-base font-semibold text-white">{result.breakdown.boardingBuffer} min</span>
              </div>
            </div>

            {/* Flight departs — bottom node */}
            <div className="relative">
              <div className="absolute left-[-20px] top-[3px] w-4 h-4 rounded-full bg-[#0A0F1E] border-2 border-white z-10" />
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-bold text-white">Flight departs</span>
                <span className="num text-lg font-bold text-white">{formatTime(result.breakdown.flightTime)}</span>
              </div>
            </div>
          </div>

          {/* Drive time loading/error */}
          {driveLoading && (
            <div className="flex items-center gap-2 mt-5">
              <Loader2 size={14} className="text-white/40 animate-spin" />
              <p className="text-[12px] text-white/40">Calculating drive time…</p>
            </div>
          )}
          {driveError && (
            <div className="flex items-center gap-2 mt-5">
              <Car size={14} className="text-red-400/60 flex-shrink-0" />
              <p className="text-[12px] text-red-400/60">{driveError}</p>
            </div>
          )}

          {/* Parking note — only show if no drive time (otherwise drive time replaces it) */}
          {!driveResult && (
            <div className="flex items-center gap-2 mt-5">
              <Car size={14} className="text-white/40 flex-shrink-0" />
              <p className="text-[12px] text-white/40">Allow extra {result.breakdown.parkingBuffer} min if driving/parking</p>
            </div>
          )}
        </div>
      )}

      {/* Links below the dark card */}
      {result && (
        <div className="flex items-center justify-between mt-4">
          <a href="/report" className="text-[11px] text-[#34D399] hover:text-[#2ec48d] font-semibold transition-colors">
            Report your wait
          </a>
          <button
            onClick={() => router.push(`/terminal/${result.terminalCode}`)}
            className="text-[11px] text-[#34D399] hover:text-[#2ec48d] font-semibold transition-colors whitespace-nowrap"
          >
            Terminal {result.terminalCode} →
          </button>
        </div>
      )}
    </div>
  )
}
