'use client'
import type { Reporter, UserReport } from './types'
import { FAKE_REPORTERS, FAKE_REPORTS } from './data/fakeReporters'
import { getRankForPoints } from './ranks'

const REPORTER_KEY = 'gt_reporter'
const REPORTS_KEY  = 'gt_reports'
const SEEDED_KEY   = 'gt_seeded_v2'

// ── Seed fake data on first load ────────────────────────────────────────────

export function ensureSeeded() {
  if (typeof window === 'undefined') return
  if (localStorage.getItem(SEEDED_KEY)) return
  const existing = getAllReports()
  if (existing.length === 0) {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(FAKE_REPORTS))
  }
  localStorage.setItem(SEEDED_KEY, '1')
}

// ── Reporter (current user) ──────────────────────────────────────────────────

export function getReporter(): Reporter | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(REPORTER_KEY)
  return raw ? JSON.parse(raw) : null
}

export function saveReporter(r: Reporter) {
  if (typeof window === 'undefined') return
  localStorage.setItem(REPORTER_KEY, JSON.stringify(r))
}

export function createReporter(nickname: string): Reporter {
  const r: Reporter = {
    id: `u_${Date.now()}`,
    nickname,
    totalPoints: 0,
    totalReports: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastReportDate: null,
    rankTitle: 'Newbie',
  }
  saveReporter(r)
  return r
}

// ── User Reports ─────────────────────────────────────────────────────────────

export function getAllReports(): UserReport[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(REPORTS_KEY)
  return raw ? JSON.parse(raw) : []
}

export function saveReport(report: UserReport) {
  const all = getAllReports()
  all.unshift(report)
  localStorage.setItem(REPORTS_KEY, JSON.stringify(all))
}

export function getRecentReports(terminalId?: string, segment?: string, hours = 2): UserReport[] {
  const cutoff = Date.now() - hours * 3_600_000
  return getAllReports()
    .filter(r => new Date(r.reportedAt).getTime() > cutoff)
    .filter(r => !terminalId || r.terminalId === terminalId)
    .filter(r => !segment || r.segment === segment)
    .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime())
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

export function getLeaderboard(): Reporter[] {
  const user = getReporter()
  const combined = [...FAKE_REPORTERS]
  if (user) {
    const idx = combined.findIndex(r => r.id === user.id)
    if (idx >= 0) combined[idx] = user
    else combined.push(user)
  }
  return combined.sort((a, b) => b.totalPoints - a.totalPoints)
}

// ── After submitting a report: update streak + points ────────────────────────

export function applyPointsToReporter(reporter: Reporter, pointsEarned: number): Reporter {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)

  let { currentStreak, longestStreak, lastReportDate } = reporter

  if (lastReportDate === today) {
    // already reported today — no streak change
  } else if (lastReportDate === yesterday) {
    currentStreak += 1
    longestStreak = Math.max(longestStreak, currentStreak)
  } else {
    currentStreak = 1
    longestStreak = Math.max(longestStreak, 1)
  }

  const totalPoints = reporter.totalPoints + pointsEarned
  const updated: Reporter = {
    ...reporter,
    totalPoints,
    totalReports: reporter.totalReports + 1,
    currentStreak,
    longestStreak,
    lastReportDate: today,
    rankTitle: getRankForPoints(totalPoints).title,
  }
  saveReporter(updated)
  return updated
}
