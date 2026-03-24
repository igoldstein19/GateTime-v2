import { getRankForPoints } from '../lib/ranks'

interface Props {
  points: number
  small?: boolean
}

export default function RankBadge({ points, small = false }: Props) {
  const rank = getRankForPoints(points)
  return (
    <span className={`inline-flex items-center font-bold border rounded-full ${rank.bgClass} ${rank.textClass} ${rank.borderClass} ${
      small ? 'text-[10px] px-2 py-0.5' : 'text-[11px] px-2.5 py-1'
    }`}>
      {rank.title}
    </span>
  )
}
