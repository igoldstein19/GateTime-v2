import { NextRequest, NextResponse } from 'next/server'
import { getDriveTime } from '../../../lib/driveTime'

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.searchParams.get('origin')
  const airport = req.nextUrl.searchParams.get('airport')?.toUpperCase() || 'BOS'
  const departureTime = req.nextUrl.searchParams.get('departureTime') || undefined

  if (!origin) {
    return NextResponse.json({ error: 'origin query param required (e.g. ?origin=Cambridge,MA)' }, { status: 400 })
  }

  try {
    const result = await getDriveTime(origin, airport, departureTime)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    // If no API key, return a graceful fallback
    if (message.includes('GOOGLE_ROUTES_API_KEY')) {
      return NextResponse.json({ error: 'Drive time not configured', detail: message }, { status: 503 })
    }
    return NextResponse.json({ error: 'Drive time lookup failed', detail: message }, { status: 500 })
  }
}
