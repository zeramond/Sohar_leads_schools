import { NextResponse } from 'next/server'
import { requireApiSession } from '@/lib/auth/session'
import { sendIphoneCall } from '@/lib/ntfy'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const unauthorized = await requireApiSession()
  if (unauthorized) return unauthorized
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'A phone number is required.' }, { status: 400 })
  try {
    const input = body as { phone?: unknown; name?: unknown }
    await sendIphoneCall(input.phone as string, input.name)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to send the iPhone notification.' }, { status: 400 })
  }
}
