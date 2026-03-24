'use client'
import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Flame, ShieldCheck, Check } from 'lucide-react'
import { AIRLINES } from '../../lib/data/airlines'
import { getTerminal } from '../../lib/data/terminals'
import {
  getReporter, createReporter, ensureSeeded,
  saveReport, applyPointsToReporter,
} from '../../lib/storage'
import { calculatePoints } from '../../lib/points'
import { getRankForPoints } from '../../lib/ranks'
import RankBadge from '../../components/RankBadge'
import TopNav from '../../components/TopNav'
import Footer from '../../components/Footer'
import type { Reporter, SegmentType } from '../../lib/types'

type TimeRange = '< 10' | '10-30' | '30-60' | '60+'

const RANGES: { label: string; value: TimeRange; minutes: number; color: string; border: string; selectedBg: string }[] = [
  { label: '< 10 min',   value: '< 10',  minutes: 5,  color: 'text-[#34D399]',  border: 'border-l-[#34D399]',  selectedBg: 'bg-[#34D399]/10' },
  { label: '10-30 min',  value: '10-30', minutes: 20, color: 'text-[#F59E0B]',  border: 'border-l-[#F59E0B]',  selectedBg: 'bg-[#F59E0B]/10' },
  { label: '30-60 min',  value: '30-60', minutes: 45, color: 'text-[#F97316]',  border: 'border-l-[#F97316]',  selectedBg: 'bg-[#F97316]/10' },
  { label: '60+ min',    value: '60+',   minutes: 75, color: 'text-[#EF4444]',  border: 'border-l-[#EF4444]',  selectedBg: 'bg-[#EF4444]/10' },
]

function uid() { return `r_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` }

// ── Points Celebration Overlay ───────────────────────────────────────────────

interface CelebrationProps {
  points: number
  bonuses: string[]
  reporter: Reporter
  prevPoints: number
  onClose: () => void
  terminalCode: string
}

function PointsCelebration({ points, bonuses, reporter, prevPoints, onClose, terminalCode }: CelebrationProps) {
  const [displayed, setDisplayed] = useState(0)
  const rankedUp = getRankForPoints(reporter.totalPoints).title !== getRankForPoints(prevPoints).title

  useEffect(() => {
    let start = 0
    const step = Math.ceil(points / 20)
    const timer = setInterval(() => {
      start = Math.min(start + step, points)
      setDisplayed(start)
      if (start >= points) clearInterval(timer)
    }, 30)
    return () => clearInterval(timer)
  }, [points])

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-3xl p-6 w-full max-w-sm animate-slide-up shadow-2xl ${rankedUp ? 'border-2 border-[#C5A255] shadow-[0_0_30px_rgba(197,162,85,0.3)]' : ''}`}>
        <div className="text-center mb-5">
          <div className="num text-6xl font-bold text-[#34D399] leading-none mb-1" style={{ animation: 'countUp 0.6s ease-out both' }}>
            +{displayed}
          </div>
          <p className="text-gray-500 text-sm">points earned</p>
        </div>

        <div className="space-y-2 mb-5">
          {bonuses.map((b, i) => (
            <div key={i} className="flex justify-between items-center text-sm"
                 style={{ animation: `slideUp 0.3s ease-out ${0.1 + i * 0.1}s both` }}>
              <span className="text-gray-500">{b.replace(/^[+-]\d+\s/, '')}</span>
              <span className="num font-bold text-[#C5A255]">{b.match(/[+-]\d+/)?.[0]}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center py-3 border-y border-gray-200 mb-4">
          <span className="text-gray-400 text-sm">Your total</span>
          <span className="num font-bold text-lg text-[#0A0F1E]">{reporter.totalPoints} pts</span>
        </div>

        {rankedUp && (
          <div className="text-center bg-amber-50 border border-[#C5A255] rounded-xl p-3 mb-4">
            <p className="text-[#C5A255] font-bold text-sm">New rank unlocked!</p>
            <RankBadge points={reporter.totalPoints} />
          </div>
        )}

        {reporter.currentStreak >= 2 && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Flame size={14} className="text-orange-500" />
            <span>{reporter.currentStreak}-day streak! Keep it going tomorrow.</span>
          </div>
        )}

        <p className="text-[11px] text-gray-400 text-center mb-4">Your report is helping travelers at Logan.</p>

        <button
          onClick={onClose}
          className="w-full py-4 bg-[#34D399] hover:bg-[#2bb884] text-[#0A0F1E] font-bold text-sm rounded-xl transition-colors"
        >
          Back to Terminal {terminalCode}
        </button>
      </div>
    </div>
  )
}

// ── Nickname Modal ────────────────────────────────────────────────────────────

function NicknameModal({ onDone }: { onDone: (r: Reporter | null) => void }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const submit = () => {
    if (name.trim().length < 2) { setError('Nickname must be at least 2 characters.'); return }
    const r = createReporter(name.trim())
    onDone(r)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-slide-up shadow-xl">
        <h2 className="num font-bold text-[#0A0F1E] text-lg mb-1">Pick a nickname</h2>
        <p className="text-sm text-gray-500 mb-4">Earn points, build streaks, and compete on the leaderboard.</p>

        <input
          type="text"
          value={name}
          onChange={e => { setName(e.target.value); setError('') }}
          placeholder="e.g. TerminalBBoss"
          maxLength={20}
          autoFocus
          className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#34D399] mb-2 transition-colors"
          onKeyDown={e => e.key === 'Enter' && submit()}
        />
        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

        <button onClick={submit} className="w-full py-3 bg-[#34D399] hover:bg-[#2bb884] text-[#0A0F1E] font-bold text-sm rounded-xl transition-colors mb-3">
          Let&apos;s go
        </button>
        <button onClick={() => onDone(null)} className="w-full py-2 text-gray-400 hover:text-gray-600 text-sm transition-colors">
          Skip — report anonymously
        </button>
      </div>
    </div>
  )
}

// ── Time Range Selector ──────────────────────────────────────────────────────

function TimeRangeSelector({
  value, onChange, skippable, onSkip, skipped
}: {
  value: TimeRange | null
  onChange: (v: TimeRange) => void
  skippable?: boolean
  onSkip?: () => void
  skipped?: boolean
}) {
  return (
    <div className="space-y-2">
      {RANGES.map(r => {
        const selected = value === r.value
        return (
          <button
            key={r.value}
            onClick={() => onChange(r.value)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-l-4 text-left transition-all shadow-none ${
              selected
                ? `${r.border} ${r.selectedBg}`
                : 'border-l-transparent bg-white hover:bg-gray-50 shadow-sm'
            }`}
          >
            <span className={`text-sm font-semibold ${selected ? r.color : 'text-gray-600'}`}>
              {r.label}
            </span>
            {selected && (
              <Check size={16} className="text-[#34D399]" />
            )}
          </button>
        )
      })}
      {skippable && (
        <button
          onClick={onSkip}
          className={`w-full text-center py-2 text-sm transition-all ${
            skipped
              ? 'text-gray-600 font-semibold'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Skipped / N/A
        </button>
      )}
    </div>
  )
}

// ── Main Report Page ──────────────────────────────────────────────────────────

function ReportForm() {
  const router = useRouter()
  const params = useSearchParams()
  const preTerminal = params.get('terminal') ?? ''

  const [reporter, setReporter] = useState<Reporter | null>(null)
  const [showNickname, setShowNickname] = useState(false)
  const [mounted, setMounted] = useState(false)

  const [airlineId, setAirlineId] = useState('')
  const [checkInRange, setCheckInRange] = useState<TimeRange | null>(null)
  const [checkInSkipped, setCheckInSkipped] = useState(false)
  const [securityRange, setSecurityRange] = useState<TimeRange | null>(null)
  const [securityPreCheck, setSecurityPreCheck] = useState(false)
  const [showLounge, setShowLounge] = useState(false)
  const [loungeRange, setLoungeRange] = useState<TimeRange | null>(null)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const [celebration, setCelebration] = useState<{
    points: number; bonuses: string[]; reporter: Reporter; prevPoints: number
  } | null>(null)

  useEffect(() => {
    ensureSeeded()
    setMounted(true)
    const r = getReporter()
    if (!r) { setShowNickname(true) } else { setReporter(r) }

    if (preTerminal) {
      const found = AIRLINES.find(a => a.terminalCode === preTerminal)
      if (found) setAirlineId(found.id)
    }
  }, [preTerminal])

  const airline = AIRLINES.find(a => a.id === airlineId)
  const terminal = airline ? getTerminal(airline.terminalCode) ?? null : null

  // Compute segments being reported
  const reportedSegments = useMemo(() => {
    const segs: SegmentType[] = []
    if (checkInRange && !checkInSkipped) segs.push('check_in')
    if (securityRange) segs.push('security')
    if (showLounge && loungeRange) segs.push('lounge')
    return segs
  }, [checkInRange, checkInSkipped, securityRange, showLounge, loungeRange])

  // Preview points
  const previewPoints = useMemo(() => {
    if (!terminal || reportedSegments.length === 0) return null
    return calculatePoints(terminal.id, reportedSegments, reporter)
  }, [terminal, reportedSegments, reporter])

  const rangeToMinutes = (r: TimeRange): number => RANGES.find(x => x.value === r)!.minutes

  const submit = () => {
    if (!airlineId) { setError('Select your airline.'); return }
    if (reportedSegments.length === 0) { setError('Report at least one segment.'); return }
    if (!terminal) return
    setError('')

    const prevPoints = reporter?.totalPoints ?? 0
    const { total: pts, bonuses } = calculatePoints(terminal.id, reportedSegments, reporter)
    const now = new Date().toISOString()
    const batchId = uid()

    // Create one report per segment
    const reports: Array<{
      id: string; terminalId: string; terminalCode: typeof terminal.code
      reporterId: string | null; segment: SegmentType; waitMinutes: number
      reportedAt: string; airline?: string; notes?: string; pointsEarned: number
    }> = []

    if (checkInRange && !checkInSkipped) {
      reports.push({
        id: `${batchId}_ci`, terminalId: terminal.id, terminalCode: terminal.code,
        reporterId: reporter?.id ?? null, segment: 'check_in',
        waitMinutes: rangeToMinutes(checkInRange), reportedAt: now,
        airline: airline?.name, pointsEarned: 0,
      })
    }
    if (securityRange) {
      reports.push({
        id: `${batchId}_sec`, terminalId: terminal.id, terminalCode: terminal.code,
        reporterId: reporter?.id ?? null, segment: 'security',
        waitMinutes: rangeToMinutes(securityRange), reportedAt: now,
        airline: airline?.name,
        notes: securityPreCheck ? 'TSA PreCheck' : undefined,
        pointsEarned: 0,
      })
    }
    if (showLounge && loungeRange) {
      reports.push({
        id: `${batchId}_lg`, terminalId: terminal.id, terminalCode: terminal.code,
        reporterId: reporter?.id ?? null, segment: 'lounge',
        waitMinutes: rangeToMinutes(loungeRange), reportedAt: now,
        airline: airline?.name, pointsEarned: 0,
      })
    }

    // Distribute points to first report
    if (reports.length > 0) reports[0].pointsEarned = pts

    // Save all reports
    for (const report of reports) saveReport(report)

    const updatedReporter = reporter ? applyPointsToReporter(reporter, pts) : null
    if (updatedReporter) setReporter(updatedReporter)

    setCelebration({
      points: pts, bonuses,
      reporter: updatedReporter ?? {
        id: '', nickname: 'Anonymous', totalPoints: pts, totalReports: 1,
        currentStreak: 0, longestStreak: 0, lastReportDate: null, rankTitle: 'Newbie',
      },
      prevPoints,
    })
  }

  if (!mounted) return null

  return (
    <>
      <TopNav />

      <div className="min-h-screen bg-[#F5F6F8] pt-16">
        <div className="max-w-2xl mx-auto px-6 py-10">
          {/* Header */}
          <h1 className="num text-2xl font-bold text-[#1A1A2E] mb-2">Report Wait Time</h1>
          <p className="text-[#6B7280] text-sm mb-6">Help fellow travelers by sharing your experience at Logan</p>

          {/* Stats bar */}
          {reporter && (
            <div className="bg-white p-4 rounded-xl shadow mb-6 flex items-center justify-center gap-3">
              <span className="text-sm font-bold text-[#1A1A2E]">{reporter.nickname}</span>
              <RankBadge points={reporter.totalPoints} small />
              <span className="num text-sm text-[#C5A255] font-bold">{reporter.totalPoints} pts</span>
              {reporter.currentStreak >= 2 && (
                <span className="flex items-center gap-1 text-xs text-orange-500">
                  <Flame size={12} /> {reporter.currentStreak}d
                </span>
              )}
            </div>
          )}

          {/* Form card */}
          <div className="bg-white p-8 rounded-xl shadow">
            {/* Airline selector */}
            <div className="mb-6">
              <p className="text-sm font-bold text-[#1A1A2E] mb-3">How was your experience at Logan today?</p>
              <div className="relative">
                <select
                  value={airlineId}
                  onChange={e => setAirlineId(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 appearance-none focus:outline-none focus:border-[#34D399] transition-colors"
                >
                  <option value="">Select airline...</option>
                  <optgroup label="-- Domestic --">
                    {AIRLINES.filter(a => !a.isInternational).map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="-- International --">
                    {AIRLINES.filter(a => a.isInternational).map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
              {airline && (
                <p className="text-sm text-[#34D399] mt-2 font-semibold">
                  → Terminal {airline.terminalCode}{airline.isInternational ? ' (International)' : ''}
                </p>
              )}
            </div>

            {/* Check-in section */}
            <div className="mb-6 border-l-4 border-l-[#3B82F6] pl-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
                <span className="text-sm font-bold text-[#1A1A2E]">Check-in line</span>
              </div>
              <TimeRangeSelector
                value={checkInSkipped ? null : checkInRange}
                onChange={v => { setCheckInRange(v); setCheckInSkipped(false) }}
                skippable
                skipped={checkInSkipped}
                onSkip={() => { setCheckInSkipped(true); setCheckInRange(null) }}
              />
            </div>

            {/* Security section */}
            <div className="mb-6 border-l-4 border-l-[#F59E0B] pl-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                  <span className="text-sm font-bold text-[#1A1A2E]">Security line</span>
                </div>
                <button
                  onClick={() => setSecurityPreCheck(v => !v)}
                  className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all ${
                    securityPreCheck
                      ? 'bg-[#34D399]/10 border-[#34D399] text-[#34D399]'
                      : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300'
                  }`}
                >
                  <ShieldCheck size={12} />
                  TSA PreCheck
                </button>
              </div>
              <TimeRangeSelector
                value={securityRange}
                onChange={setSecurityRange}
              />
            </div>

            {/* Lounge section (collapsible) */}
            {!showLounge ? (
              <button
                onClick={() => setShowLounge(true)}
                className="w-full text-center py-3 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6"
              >
                + Add lounge wait
              </button>
            ) : (
              <div className="mb-6 border-l-4 border-l-[#8B5CF6] pl-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
                    <span className="text-sm font-bold text-[#1A1A2E]">Lounge line</span>
                  </div>
                  <button
                    onClick={() => { setShowLounge(false); setLoungeRange(null) }}
                    className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Remove
                  </button>
                </div>
                <TimeRangeSelector value={loungeRange} onChange={setLoungeRange} />
              </div>
            )}

            {/* Notes */}
            <div className="mb-6">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                Notes <span className="text-gray-300 normal-case font-normal tracking-normal">(optional)</span>
              </p>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. TSA PreCheck lane was separate"
                maxLength={120}
                className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#34D399] transition-colors"
              />
            </div>

            {/* Error display */}
            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl mb-6">
                <p className="text-sm text-red-600 font-semibold">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={submit}
              disabled={reportedSegments.length === 0}
              className="bg-[#34D399] hover:bg-[#2bb884] active:bg-[#22a06e] disabled:opacity-30 disabled:cursor-not-allowed text-[#0A0F1E] font-bold text-sm rounded-xl py-4 w-full transition-colors"
            >
              Submit Report{previewPoints ? ` (+${previewPoints.total} pts)` : ''}
            </button>
          </div>
        </div>
      </div>

      <Footer />

      {showNickname && (
        <NicknameModal onDone={r => { setReporter(r); setShowNickname(false) }} />
      )}

      {celebration && terminal && (
        <PointsCelebration
          points={celebration.points}
          bonuses={celebration.bonuses}
          reporter={celebration.reporter}
          prevPoints={celebration.prevPoints}
          terminalCode={terminal.code}
          onClose={() => {
            setCelebration(null)
            router.push(`/terminal/${terminal.code}`)
          }}
        />
      )}
    </>
  )
}

export default function ReportPage() {
  return (
    <Suspense>
      <ReportForm />
    </Suspense>
  )
}
