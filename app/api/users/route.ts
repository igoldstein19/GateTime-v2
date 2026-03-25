import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const USERS_FILE = path.join(process.cwd(), 'scripts', 'users.json')

interface User {
  email: string
  homeAddress: string
  registeredAt: string
}

function readUsers(): User[] {
  try {
    if (!fs.existsSync(USERS_FILE)) return []
    const data = fs.readFileSync(USERS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

function writeUsers(users: User[]) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8')
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) {
    return NextResponse.json({ error: 'email param required' }, { status: 400 })
  }
  const users = readUsers()
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase())
  return NextResponse.json({ registered: !!user, user: user || null })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, homeAddress } = body

    if (!email || !homeAddress) {
      return NextResponse.json({ error: 'email and homeAddress are required' }, { status: 400 })
    }

    const users = readUsers()
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (existing) {
      existing.homeAddress = homeAddress
      writeUsers(users)
      return NextResponse.json({ success: true, message: 'Updated', user: existing })
    }

    const newUser: User = {
      email,
      homeAddress,
      registeredAt: new Date().toISOString(),
    }
    users.push(newUser)
    writeUsers(users)

    return NextResponse.json({ success: true, message: 'Registered', user: newUser })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
