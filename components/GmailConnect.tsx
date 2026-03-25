'use client'
import { useState } from 'react'
import { Mail, CheckCircle, MapPin, Plane } from 'lucide-react'

export default function GmailConnect() {
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const submit = async () => {
    if (!email.trim() || !address.trim()) {
      setErrorMsg('Please fill in both fields.')
      return
    }
    if (!email.includes('@')) {
      setErrorMsg('Please enter a valid email address.')
      return
    }
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), homeAddress: address.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setStatus('success')
      } else {
        setErrorMsg(data.error || 'Something went wrong.')
        setStatus('error')
      }
    } catch {
      setErrorMsg('Failed to connect. Try again.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-[#0A0F1E] rounded-2xl p-8 lg:p-12 text-center">
        <div className="w-16 h-16 bg-[#34D399]/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-[#34D399]" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
          You&apos;re signed up!
        </h3>
        <p className="text-white/60 text-sm max-w-md mx-auto">
          We&apos;ll scan your inbox for flight confirmations and email you a personalized reminder
          with your leave-home time and airport arrival time before each flight.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-[#0A0F1E] rounded-2xl overflow-hidden">
      <div className="grid lg:grid-cols-2 gap-0">
        {/* Left: Info */}
        <div className="p-8 lg:p-12 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#34D399]/20 rounded-xl flex items-center justify-center">
              <Mail size={20} className="text-[#34D399]" />
            </div>
            <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Get flight reminders
            </h3>
          </div>
          <p className="text-white/60 text-sm mb-6 leading-relaxed">
            Connect your email and we&apos;ll automatically detect your flight confirmations.
            Before each flight, you&apos;ll receive a personalized email telling you exactly
            when to leave home and when to arrive at the airport.
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Plane size={16} className="text-[#34D399] mt-0.5 flex-shrink-0" />
              <p className="text-white/50 text-xs">Scans Gmail for flight confirmation emails from any airline</p>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={16} className="text-[#34D399] mt-0.5 flex-shrink-0" />
              <p className="text-white/50 text-xs">Calculates drive time from your home with real-time traffic</p>
            </div>
            <div className="flex items-start gap-3">
              <Mail size={16} className="text-[#34D399] mt-0.5 flex-shrink-0" />
              <p className="text-white/50 text-xs">Sends reminders 1 day before and 5 hours before you need to leave</p>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="bg-white/5 p-8 lg:p-12 flex flex-col justify-center">
          <div className="space-y-4">
            <div>
              <label className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1.5 block">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrorMsg('') }}
                placeholder="you@gmail.com"
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#34D399]/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1.5 block">
                Home address
              </label>
              <input
                type="text"
                value={address}
                onChange={e => { setAddress(e.target.value); setErrorMsg('') }}
                placeholder="e.g. 123 Main St, Cambridge, MA"
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#34D399]/50 transition-colors"
              />
            </div>

            {errorMsg && (
              <p className="text-red-400 text-xs">{errorMsg}</p>
            )}

            <button
              onClick={submit}
              disabled={status === 'loading'}
              className="w-full py-3.5 bg-[#34D399] hover:bg-[#2CC38A] active:bg-[#25B07A] disabled:opacity-50 text-[#0A0F1E] font-bold text-sm rounded-xl transition-colors"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              {status === 'loading' ? 'Signing up...' : 'Sign up for reminders'}
            </button>

            <p className="text-white/30 text-[11px] text-center">
              We only read flight confirmation emails. No spam, ever.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
