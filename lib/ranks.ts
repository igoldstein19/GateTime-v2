export interface RankInfo {
  title: string
  color: string         // hex
  textClass: string     // tailwind
  bgClass: string
  borderClass: string
  minPoints: number
  maxPoints: number | null
}

export const RANKS: RankInfo[] = [
  { title: 'Newbie',       color: '#6B7280', textClass: 'text-gray-500',   bgClass: 'bg-gray-100',   borderClass: 'border-gray-300',   minPoints: 0,    maxPoints: 49   },
  { title: 'Spotter',      color: '#3B82F6', textClass: 'text-blue-600',   bgClass: 'bg-blue-50',    borderClass: 'border-blue-200',   minPoints: 50,   maxPoints: 149  },
  { title: 'Regular',      color: '#22C55E', textClass: 'text-green-600',  bgClass: 'bg-green-50',   borderClass: 'border-green-200',  minPoints: 150,  maxPoints: 349  },
  { title: 'Terminal Pro', color: '#F59E0B', textClass: 'text-amber-600',  bgClass: 'bg-amber-50',   borderClass: 'border-amber-200',  minPoints: 350,  maxPoints: 699  },
  { title: 'Gate Legend',  color: '#F97316', textClass: 'text-orange-600', bgClass: 'bg-orange-50',  borderClass: 'border-orange-200', minPoints: 700,  maxPoints: 1199 },
  { title: 'Logan VIP',    color: '#EF4444', textClass: 'text-red-600',    bgClass: 'bg-red-50',     borderClass: 'border-red-200',    minPoints: 1200, maxPoints: null },
]

export function getRankForPoints(points: number): RankInfo {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (points >= RANKS[i].minPoints) return RANKS[i]
  }
  return RANKS[0]
}

export function getNextRank(points: number): RankInfo | null {
  const current = getRankForPoints(points)
  const idx = RANKS.findIndex(r => r.title === current.title)
  return idx < RANKS.length - 1 ? RANKS[idx + 1] : null
}
