'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { DOMESTIC_AIRLINES, INTERNATIONAL_AIRLINES } from '../lib/data/airlines'
import { getTerminalEstimate } from '../lib/estimates'
import { ensureSeeded } from '../lib/storage'
import type { TerminalEstimate } from '../lib/types'

function statusColor(mins: number) {
  if (mins < 30) return 'text-[#34D399]'
  if (mins < 45) return 'text-[#F59E0B]'
  return 'text-[#EF4444]'
}

function statusDot(mins: number) {
  if (mins < 30) return 'bg-[#34D399]'
  if (mins < 45) return 'bg-[#F59E0B]'
  return 'bg-[#EF4444]'
}

function AirlineRow({ airline }: { airline: (typeof DOMESTIC_AIRLINES)[number] }) {
  const router = useRouter()
  const [est, setEst] = useState<TerminalEstimate | null>(null)

  useEffect(() => {
    setEst(getTerminalEstimate(airline.terminalId))
  }, [airline.terminalId])

  const total = est?.totalMinutes ?? null

  return (
    <button
      onClick={() => router.push(`/terminal/${airline.terminalCode}`)}
      className="card-hover w-full flex items-center gap-3 px-4 py-3 text-left group"
    >
      <div className="w-8 h-8 rounded-lg bg-[#0A0F1E] flex items-center justify-center flex-shrink-0">
        <span className="num text-[11px] font-bold text-white">{airline.code}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-[#1A1A2E] truncate">{airline.name}</div>
        <div className="text-[11px] text-[#6B7280]">Terminal {airline.terminalCode}</div>
      </div>
      {total !== null && (
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${statusDot(total)}`} />
          <span className={`num font-bold text-base ${statusColor(total)} tabular-nums`}>
            ~{total}m
          </span>
        </div>
      )}
      <ChevronRight size={14} className="text-[#9CA3AF] group-hover:text-[#6B7280] transition-colors flex-shrink-0" />
    </button>
  )
}

export default function AirlineGrid() {
  useEffect(() => { ensureSeeded() }, [])

  return (
    <div className="animate-slide-up delay-100">
      <p className="num font-semibold text-[#1A1A2E] text-lg mb-3">
        Current Wait Times
      </p>

      <div className="card overflow-hidden divide-y divide-gray-50">
        <div className="px-4 py-2 bg-gray-100">
          <span className="text-[11px] text-[#6B7280] font-semibold uppercase tracking-widest">Domestic</span>
        </div>
        {DOMESTIC_AIRLINES.map(a => <AirlineRow key={a.id} airline={a} />)}

        <div className="px-4 py-2 bg-gray-100">
          <span className="text-[11px] text-[#6B7280] font-semibold uppercase tracking-widest">International</span>
        </div>
        {INTERNATIONAL_AIRLINES.map(a => <AirlineRow key={a.id} airline={a} />)}
      </div>
    </div>
  )
}
