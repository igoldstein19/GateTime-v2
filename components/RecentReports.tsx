import { formatDistanceToNow } from 'date-fns'
import type { UserReport, SegmentType } from '../lib/types'
import { FAKE_REPORTERS } from '../lib/data/fakeReporters'
import { getRankForPoints } from '../lib/ranks'

const SEG_META: Record<SegmentType, { label: string; dot: string; text: string }> = {
  check_in: { label: 'Check-in', dot: 'bg-[#3B82F6]',  text: 'text-[#3B82F6]'  },
  security: { label: 'Security', dot: 'bg-[#F59E0B]',  text: 'text-[#F59E0B]'  },
  lounge:   { label: 'Lounge',   dot: 'bg-[#8B5CF6]',  text: 'text-[#8B5CF6]'  },
}

function getNickname(reporterId: string | null): { nickname: string; rankTitle: string; rankTextClass: string } | null {
  if (!reporterId) return null
  const r = FAKE_REPORTERS.find(f => f.id === reporterId)
  if (!r) return null
  const rank = getRankForPoints(r.totalPoints)
  return { nickname: r.nickname, rankTitle: r.rankTitle, rankTextClass: rank.textClass }
}

interface Props {
  reports: UserReport[]
}

export default function RecentReports({ reports }: Props) {
  if (reports.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-[#6B7280] text-sm">No reports yet in the last 2h</p>
        <p className="text-[#9CA3AF] text-xs mt-1">Be the first to report your wait!</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-50">
      {reports.slice(0, 8).map(report => {
        const meta    = SEG_META[report.segment]
        const timeAgo = formatDistanceToNow(new Date(report.reportedAt), { addSuffix: true })
        const person  = getNickname(report.reporterId)

        return (
          <div key={report.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <span className={`w-2 h-2 rounded-full ${meta.dot} flex-shrink-0 mt-1`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {person && (
                  <span className="text-[11px] font-bold text-[#1A1A2E]">{person.nickname}</span>
                )}
                <span className={`text-[11px] font-semibold ${meta.text}`}>{meta.label}</span>
                <span className="num font-bold text-[#1A1A2E] text-[13px] tabular-nums">{report.waitMinutes} min</span>
                {report.airline && (
                  <span className="text-[10px] text-[#6B7280] bg-[#0A0F1E]/5 px-1.5 py-0.5 rounded-full">
                    {report.airline}
                  </span>
                )}
              </div>
              {report.notes && (
                <p className="text-[11px] text-[#6B7280] italic mt-0.5 truncate">{report.notes}</p>
              )}
            </div>
            <span className="text-[11px] text-[#9CA3AF] whitespace-nowrap flex-shrink-0">{timeAgo}</span>
          </div>
        )
      })}
    </div>
  )
}
