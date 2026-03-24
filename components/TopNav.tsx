'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import Image from 'next/image'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/report', label: 'Report Wait Time' },
  { href: '/leaderboard', label: 'Leaderboard' },
]

export default function TopNav() {
  const path = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/' ? path === '/' : path.startsWith(href)

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <Image src="/logo.svg" alt="GateTime" width={120} height={40} priority className="h-10 w-auto" />
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm font-medium transition-colors relative py-1 ${
                isActive(href)
                  ? 'text-[#003B71] font-semibold'
                  : 'text-[#6B7280] hover:text-[#003B71]'
              }`}
            >
              {label}
              {isActive(href) && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C5A255] rounded-full" />
              )}
            </Link>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(v => !v)}
          className="md:hidden text-[#003B71] p-1"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(href)
                  ? 'text-[#003B71] bg-gray-50 font-semibold'
                  : 'text-[#6B7280] hover:text-[#003B71] hover:bg-gray-50'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
