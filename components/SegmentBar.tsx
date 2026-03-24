import type { TerminalEstimate } from '../lib/types'

interface Props {
  estimate: TerminalEstimate
  includeLounge?: boolean
}

const SEG_COLORS = {
  check_in: { bar: 'bg-[#2563EB]',  label: 'Check-in', text: 'text-[#2563EB]',  border: 'border-l-4 border-l-[#2563EB]'  },
  security: { bar: 'bg-[#D97706]',  label: 'Security', text: 'text-[#D97706]',  border: 'border-l-4 border-l-[#D97706]' },
  walk:     { bar: 'bg-[#6B7280]',  label: 'Walk',     text: 'text-[#6B7280]',  border: 'border-l-4 border-l-[#6B7280] border-dashed' },
  lounge:   { bar: 'bg-[#7C3AED]',  label: 'Lounge',   text: 'text-[#7C3AED]',  border: 'border-l-4 border-l-[#7C3AED]' },
}

export default function SegmentBar({ estimate, includeLounge = false }: Props) {
  const segments = [
    { key: 'check_in' as const, mins: estimate.check_in.minutes, isLive: estimate.check_in.isLive },
    { key: 'security' as const, mins: estimate.security.minutes, isLive: estimate.security.isLive },
    { key: 'walk'     as const, mins: estimate.walk,             isLive: false },
    ...(includeLounge ? [{ key: 'lounge' as const, mins: estimate.lounge.minutes, isLive: false }] : []),
  ]
  const total = segments.reduce((s, seg) => s + seg.mins, 0)

  return (
    <div className="space-y-3">
      {/* Stacked bar */}
      <div className="flex w-full h-8 rounded-xl overflow-hidden bg-[#0A0F1E]/5">
        {segments.map(seg => {
          const pct = total > 0 ? (seg.mins / total) * 100 : 0
          const colors = SEG_COLORS[seg.key]
          const isWalk = seg.key === 'walk'
          return (
            <div
              key={seg.key}
              className={`${colors.bar} ${isWalk ? 'opacity-50' : ''} flex items-center justify-center relative transition-all duration-500`}
              style={{
                width: `${pct}%`,
                minWidth: pct > 0 ? '1.5rem' : 0,
                ...(isWalk ? { backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,0.1) 3px, rgba(0,0,0,0.1) 6px)' } : {}),
              }}
            >
              {pct > 13 && (
                <span className="text-white text-[11px] font-bold num drop-shadow">{seg.mins}m</span>
              )}
              <span className="absolute right-0 top-0 bottom-0 w-px bg-white/50" />
            </div>
          )
        })}
      </div>

      {/* Segment tiles */}
      <div className={`grid gap-2 ${includeLounge ? 'grid-cols-4' : 'grid-cols-3'}`}>
        {segments.map(seg => {
          const colors = SEG_COLORS[seg.key]
          return (
            <div key={seg.key} className={`bg-white shadow-sm ${colors.border} rounded-xl p-3`}>
              <div className="flex items-center gap-1 mb-1.5">
                <span className={`text-[9px] font-bold ${colors.text} uppercase tracking-widest`}>{colors.label}</span>
                {seg.isLive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                )}
              </div>
              <div className="num font-bold text-[1.3rem] text-[#1A1A2E] leading-none tabular-nums">
                {seg.mins}<span className="text-xs text-[#9CA3AF] ml-0.5 font-normal">m</span>
              </div>
              {seg.key === 'walk' && (
                <span className="text-[8px] text-[#9CA3AF] uppercase tracking-wider mt-0.5">Fixed</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
