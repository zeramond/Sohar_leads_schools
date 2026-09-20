export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireApiSession } from '@/lib/auth/session'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const unauthorized = await requireApiSession()
    if (unauthorized) return unauthorized
    const { id } = await params
    const leadId = parseInt(id, 10)

    if (isNaN(leadId)) {
      return NextResponse.json({ error: 'Invalid lead ID' }, { status: 400 })
    }

    const updated = await prisma.soharLead.update({
      where: { id: leadId },
      data: {
        status: 'Contacted',
        lastContacted: new Date(),
      },
    })

    return NextResponse.json({ lead: updated })
  } catch (err: any) {
    console.error('Error updating lead:', err)
    return NextResponse.json(
      { error: 'Failed to mark lead as contacted' },
      { status: 500 }
    )
  }
}
