import { NextResponse } from 'next/server'
import { requireApiSession } from '@/lib/auth/session'
import { publishNtfy } from '@/lib/ntfy'

export const dynamic = 'force-dynamic'

export async function POST() {
  const unauthorized = await requireApiSession()
  if (unauthorized) return unauthorized
  try {
    await publishNtfy({ title: 'CRM iPhone handoff test', message: 'ntfy is configured correctly. A lead call will open the Phone app.', tags: ['white_check_mark'] })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to send the test notification.' }, { status: 400 })
  }
}
