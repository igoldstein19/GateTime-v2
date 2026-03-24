'use client'
import Link from 'next/link'
import { Trophy } from 'lucide-react'
import { getLeaderboard } from '../lib/storage'
import RankBadge from './RankBadge'

const MEDAL = ['🥇', '🥈', '🥉']

export default function LeaderboardPreview() {
  const top3 = getLeaderboard().slice(0, 3)

  return (
    <div className="card p-5 animate-slide-up delay-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy size={14} className="text-[#C5A255]" />
          <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Top Reporters</span>
        </div>
        <Link href="/leaderboard" className="text-[11px] text-[#34D399] hover:text-[#2ec48d] font-semibold transition-colors">
          See all →
        </Link>
      </div>

      <div className="space-y-2">
        {top3.map((r, i) => (
          <div key={r.id} className="flex items-center gap-3">
            <span className="text-base w-6 text-center">{MEDAL[i]}</span>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-[#1A1A2E] truncate block">{r.nickname}</span>
            </div>
            <RankBadge points={r.totalPoints} small />
            <span className="num text-sm font-bold text-[#C5A255] tabular-nums">{r.totalPoints}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
