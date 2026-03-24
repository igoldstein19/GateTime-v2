import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-[#0A0F1E] mt-16">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-12">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          {/* Left: logo + tagline */}
          <div className="max-w-sm">
            <Image src="/logo.svg" alt="GateTime" width={140} height={50} className="h-12 w-auto brightness-0 invert opacity-80 mb-3" />
            <p className="text-white/50 text-sm leading-relaxed">
              Crowdsourced wait times for Boston Logan International Airport. Know before you go.
            </p>
          </div>

          {/* Right: nav + credit */}
          <div className="flex flex-col items-start md:items-end gap-4">
            <div className="flex gap-6">
              <Link href="/" className="text-white/60 hover:text-white text-sm transition-colors">Home</Link>
              <Link href="/report" className="text-white/60 hover:text-white text-sm transition-colors">Report</Link>
              <Link href="/leaderboard" className="text-white/60 hover:text-white text-sm transition-colors">Leaderboard</Link>
            </div>
            <p className="text-white/30 text-xs">Built by HBS students</p>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6">
          <p className="text-white/25 text-xs text-center">&copy; {new Date().getFullYear()} GateTime. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
