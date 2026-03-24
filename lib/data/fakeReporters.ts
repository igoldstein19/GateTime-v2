import type { Reporter, UserReport } from '../types'

export const FAKE_REPORTERS: Reporter[] = [
  { id: 'r1', nickname: 'TerminalBBoss',  totalPoints: 850, totalReports: 42, currentStreak: 7,  longestStreak: 7,  lastReportDate: null, rankTitle: 'Gate Legend'  },
  { id: 'r2', nickname: 'DeltaDave',      totalPoints: 620, totalReports: 31, currentStreak: 3,  longestStreak: 8,  lastReportDate: null, rankTitle: 'Terminal Pro' },
  { id: 'r3', nickname: 'JetBluJen',      totalPoints: 480, totalReports: 24, currentStreak: 5,  longestStreak: 5,  lastReportDate: null, rankTitle: 'Terminal Pro' },
  { id: 'r4', nickname: 'GateRunner',     totalPoints: 350, totalReports: 18, currentStreak: 2,  longestStreak: 4,  lastReportDate: null, rankTitle: 'Terminal Pro' },
  { id: 'r5', nickname: 'TSA_Tim',        totalPoints: 220, totalReports: 11, currentStreak: 0,  longestStreak: 3,  lastReportDate: null, rankTitle: 'Regular'     },
  { id: 'r6', nickname: 'LoungeQueen',    totalPoints: 150, totalReports: 8,  currentStreak: 1,  longestStreak: 2,  lastReportDate: null, rankTitle: 'Regular'     },
  { id: 'r7', nickname: 'EarlyBird_Ed',   totalPoints: 90,  totalReports: 5,  currentStreak: 0,  longestStreak: 1,  lastReportDate: null, rankTitle: 'Spotter'     },
  { id: 'r8', nickname: 'RedEyeRay',      totalPoints: 50,  totalReports: 3,  currentStreak: 0,  longestStreak: 1,  lastReportDate: null, rankTitle: 'Spotter'     },
]

function ago(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString()
}

export const FAKE_REPORTS: UserReport[] = [
  { id: 'fr1',  terminalId: 'term-b', terminalCode: 'B', reporterId: 'r1', segment: 'security', waitMinutes: 20, reportedAt: ago(8),  airline: 'United',    notes: 'PreCheck lane open',  pointsEarned: 25 },
  { id: 'fr2',  terminalId: 'term-b', terminalCode: 'B', reporterId: 'r2', segment: 'security', waitMinutes: 21, reportedAt: ago(18), airline: 'United',    notes: '',                    pointsEarned: 15 },
  { id: 'fr3',  terminalId: 'term-b', terminalCode: 'B', reporterId: 'r3', segment: 'check_in', waitMinutes: 12, reportedAt: ago(35), airline: 'United',    notes: '',                    pointsEarned: 10 },
  { id: 'fr4',  terminalId: 'term-b', terminalCode: 'B', reporterId: 'r4', segment: 'security', waitMinutes: 23, reportedAt: ago(52), airline: '',          notes: '',                    pointsEarned: 10 },
  { id: 'fr5',  terminalId: 'term-b', terminalCode: 'B', reporterId: 'r5', segment: 'check_in', waitMinutes: 14, reportedAt: ago(68), airline: 'JetBlue',   notes: '',                    pointsEarned: 10 },
  { id: 'fr6',  terminalId: 'term-b', terminalCode: 'B', reporterId: 'r1', segment: 'check_in', waitMinutes: 11, reportedAt: ago(75), airline: 'Southwest', notes: '',                    pointsEarned: 10 },
  { id: 'fr7',  terminalId: 'term-b', terminalCode: 'B', reporterId: 'r6', segment: 'security', waitMinutes: 15, reportedAt: ago(95), airline: 'Air Canada', notes: '',                   pointsEarned: 10 },
  { id: 'fr8',  terminalId: 'term-e', terminalCode: 'E', reporterId: 'r2', segment: 'security', waitMinutes: 22, reportedAt: ago(20), airline: 'British Airways', notes: '',              pointsEarned: 15 },
  { id: 'fr9',  terminalId: 'term-e', terminalCode: 'E', reporterId: 'r7', segment: 'check_in', waitMinutes: 18, reportedAt: ago(45), airline: 'Emirates',  notes: 'Long queue at counter', pointsEarned: 10 },
  { id: 'fr10', terminalId: 'term-e', terminalCode: 'E', reporterId: 'r3', segment: 'security', waitMinutes: 25, reportedAt: ago(80), airline: '',          notes: '',                    pointsEarned: 10 },
  { id: 'fr11', terminalId: 'term-a', terminalCode: 'A', reporterId: 'r8', segment: 'security', waitMinutes: 14, reportedAt: ago(30), airline: 'Delta',     notes: 'Sky Priority fast',   pointsEarned: 15 },
  { id: 'fr12', terminalId: 'term-a', terminalCode: 'A', reporterId: 'r4', segment: 'check_in', waitMinutes: 9,  reportedAt: ago(60), airline: 'Delta',     notes: '',                    pointsEarned: 10 },
  { id: 'fr13', terminalId: 'term-c', terminalCode: 'C', reporterId: 'r5', segment: 'security', waitMinutes: 16, reportedAt: ago(40), airline: 'JetBlue',   notes: '',                    pointsEarned: 10 },
  { id: 'fr14', terminalId: 'term-c', terminalCode: 'C', reporterId: 'r6', segment: 'check_in', waitMinutes: 10, reportedAt: ago(90), airline: 'JetBlue',   notes: 'Kiosk check-in quick', pointsEarned: 10 },
  { id: 'fr15', terminalId: 'term-b', terminalCode: 'B', reporterId: 'r3', segment: 'check_in', waitMinutes: 13, reportedAt: ago(110), airline: 'American Airlines', notes: '',           pointsEarned: 10 },
]
