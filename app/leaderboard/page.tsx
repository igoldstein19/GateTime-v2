'use client'
import { useState, useEffect } from 'react'
import { Flame } from 'lucide-react'
import { getLeaderboard, getReporter } from '../../lib/storage'
import { getNextRank } from '../../lib/ranks'
import RankBadge from '../../components/RankBadge'
import TopNav from '../../components/TopNav'
import Footer from '../../components/Footer'
import type { Reporter } from '../../lib/types'

const MEDAL = ['🥇', '🥈', '🥉']

type TimeFilter = 'all' | 'week'

export default function LeaderboardPage() {
  const [board, setBoard] = useState<Reporter[]>([])
  const [me, setMe]       = useState<Reporter | null>(null)
  const [mounted, setMounted] = useState(false)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')

  useEffect(() => {
    setMounted(true)
    setBoard(getLeaderboard())
    setMe(getReporter())
  }, [])

  if (!mounted) return null

  const myRank = me ? board.findIndex(r => r.id === me.id) + 1 : null
  const nextRank = me ? getNextRank(me.totalPoints) : null
  const ptsToNext = nextRank ? nextRank.minPoints - (me?.totalPoints ?? 0) : null

  const RANK_BORDER = [
    'border-l-4 border-l-[#F59E0B]',
    'border-l-4 border-l-[#9CA3AF]',
    'border-l-4 border-l-[#CD7F32]',
  ]

  return (
    <>
      <TopNav />
      <div className="min-h-screen bg-[#F5F6F8] pt-16">
        <div className="max-w-3xl mx-auto px-6 py-10">
          {/* Header */}
          <h1 className="num text-2xl font-bold text-[#1A1A2E] mb-1">Leaderboard</h1>
          <p className="text-[#6B7280] text-sm mb-6">Top reporters at Boston Logan</p>

          {/* Toggle pills */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
            {([['all', 'All Time'], ['week', 'This Week']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTimeFilter(key)}
                className={`px-4 py-1.5 text-xs font-bold transition-all ${
                  timeFilter === key
                    ? 'bg-[#34D399] text-[#0A0F1E] rounded-lg'
                    : 'text-[#6B7280] hover:text-[#1A1A2E] rounded-lg'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {timeFilter === 'week' && (
            <p className="text-[11px] text-gray-400 text-center mb-4">Showing all-time standings (weekly tracking coming soon)</p>
          )}

          {/* Top 10 table */}
          <div className="bg-white rounded-xl shadow overflow-hidden divide-y divide-gray-50">
            {board.slice(0, 10).map((r, i) => {
              const isMe = me?.id === r.id
              return (
                <div
                  key={r.id}
                  className={`px-6 py-4 flex items-center gap-4 ${
                    i < 3 ? RANK_BORDER[i] : ''
                  } ${isMe ? 'bg-[#34D399]/5' : ''}`}
                >
                  {/* Rank */}
                  <div className="w-12 flex-shrink-0 text-center">
                    {i < 3
                      ? <span className="text-lg">{MEDAL[i]}</span>
                      : <span className="num text-sm font-bold text-gray-400">#{i + 1}</span>
                    }
                  </div>

                  {/* Name + details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[#1A1A2E] truncate">
                        {r.nickname}
                        {isMe && <span className="text-[#34D399] ml-1">(you)</span>}
                      </span>
                      <RankBadge points={r.totalPoints} small />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-gray-400">{r.totalReports} reports</span>
                      {r.currentStreak >= 3 && (
                        <span className="flex items-center gap-1 text-[11px] text-orange-500">
                          <Flame size={10} /> {r.currentStreak}d streak
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Points */}
                  <span className="num font-bold text-[#0A0F1E] text-base tabular-nums flex-shrink-0 ml-auto">
                    {r.totalPoints}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Your position (if outside top 10) */}
          {me && myRank && myRank > 10 && (
            <div className="mt-6 border-l-4 border-l-[#34D399] bg-[#34D399]/5 rounded-xl shadow p-5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Your Position</p>
              <div className="flex items-center gap-4">
                <span className="num text-lg font-bold text-[#34D399]">#{myRank}</span>
                <div className="flex-1">
                  <div className="text-sm font-bold text-[#1A1A2E]">{me.nickname}</div>
                  <RankBadge points={me.totalPoints} small />
                </div>
                <span className="num font-bold text-[#0A0F1E]">{me.totalPoints} pts</span>
              </div>
              {ptsToNext && nextRank && (
                <p className="text-[11px] text-gray-400 mt-2">
                  {ptsToNext} more points to <span className={nextRank.textClass}>{nextRank.title}</span>
                </p>
              )}
            </div>
          )}

          {/* Progress hint if in top 10 */}
          {me && myRank && myRank <= 10 && ptsToNext && nextRank && (
            <div className="mt-6 bg-white rounded-xl shadow p-4 text-center">
              <p className="text-[11px] text-gray-400">
                {ptsToNext} more points to reach <span className={nextRank.textClass}>{nextRank.title}</span>
              </p>
            </div>
          )}

          {/* No-user CTA */}
          {!me && (
            <div className="mt-6 bg-white rounded-xl shadow p-6 text-center">
              <p className="text-sm text-gray-500 mb-3">Start reporting to join the leaderboard!</p>
              <a href="/report" className="inline-block py-2.5 px-6 bg-[#34D399] hover:bg-[#2CC38A] text-[#0A0F1E] font-bold text-sm rounded-xl transition-colors">
                Report a Wait Time
              </a>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
