'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Plus, Trophy } from 'lucide-react'

export default function BottomNav() {
  const path = usePathname()
  const isHome = path === '/'
  const isReport = path.startsWith('/report')
  const isLeaderboard = path.startsWith('/leaderboard')

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0A0F1E] z-50" style={{ borderRadius: '20px 20px 0 0' }}>
      <div className="max-w-5xl mx-auto flex items-end justify-around px-2 pb-1 pt-1">
        <Link href="/" className="flex flex-col items-center gap-0.5 py-2 px-4">
          <Home size={20} strokeWidth={isHome ? 2.5 : 1.8} className={isHome ? 'text-[#34D399]' : 'text-white/50'} />
          <span className={`text-[10px] font-medium ${isHome ? 'text-[#34D399]' : 'text-white/50'}`}>Home</span>
          {isHome && <span className="w-1 h-1 rounded-full bg-[#34D399]" />}
        </Link>

        <Link href="/report" className="flex flex-col items-center gap-0.5 -mt-5">
          <div className="w-14 h-14 rounded-full bg-[#34D399] flex items-center justify-center shadow-lg transition-transform active:scale-95">
            <Plus size={26} strokeWidth={2.5} className="text-[#0A0F1E]" />
          </div>
          <span className={`text-[10px] font-medium mt-0.5 ${isReport ? 'text-[#34D399]' : 'text-white/50'}`}>Report</span>
          {isReport && <span className="w-1 h-1 rounded-full bg-[#34D399]" />}
        </Link>

        <Link href="/leaderboard" className="flex flex-col items-center gap-0.5 py-2 px-4">
          <Trophy size={20} strokeWidth={isLeaderboard ? 2.5 : 1.8} className={isLeaderboard ? 'text-[#34D399]' : 'text-white/50'} />
          <span className={`text-[10px] font-medium ${isLeaderboard ? 'text-[#34D399]' : 'text-white/50'}`}>Board</span>
          {isLeaderboard && <span className="w-1 h-1 rounded-full bg-[#34D399]" />}
        </Link>
      </div>
    </nav>
  )
}
