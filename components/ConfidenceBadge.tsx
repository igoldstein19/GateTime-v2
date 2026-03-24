import { Zap, BarChart2 } from 'lucide-react'

interface Props {
  isLive: boolean
  liveCount: number
}

export default function ConfidenceBadge({ isLive, liveCount }: Props) {
  if (isLive) {
    return (
      <span className="inline-flex items-center gap-1.5 bg-[#34D399]/10 border border-[#34D399]/20 rounded-full px-3 py-1">
        <Zap size={10} className="text-[#34D399]" />
        <span className="text-[#34D399] text-[11px] font-bold">{liveCount} live {liveCount === 1 ? 'report' : 'reports'}</span>
        <span className="text-[#34D399]/60 text-[11px]">· last 2h</span>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 bg-[#0A0F1E]/5 border border-[#0A0F1E]/10 rounded-full px-3 py-1">
      <BarChart2 size={10} className="text-[#6B7280]" />
      <span className="text-[#6B7280] text-[11px] font-medium">Historical average</span>
    </span>
  )
}
