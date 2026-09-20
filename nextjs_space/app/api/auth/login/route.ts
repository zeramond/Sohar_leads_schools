import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { isAuthConfigured, setSession } from '@/lib/auth/session'

export async function POST(request: Request) {
  const configuredPassword = process.env.CRM_ACCESS_PASSWORD
  if (!configuredPassword || !isAuthConfigured()) return NextResponse.json({ error: 'CRM access is not configured. Add CRM_ACCESS_PASSWORD and CRM_SESSION_SECRET to .env.' }, { status: 503 })
  const { password } = await request.json().catch(() => ({ password: '' }))
  const received = Buffer.from(String(password)); const expected = Buffer.from(configuredPassword)
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })
  }
  const response = NextResponse.json({ ok: true })
  setSession(response)
  return response
}
