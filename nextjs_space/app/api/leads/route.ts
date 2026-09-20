export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireApiSession } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  try {
    const unauthorized = await requireApiSession()
    if (unauthorized) return unauthorized
    const searchParams = request?.nextUrl?.searchParams
    const search = searchParams?.get?.('search') ?? ''

    const where = search
      // SQLite's LIKE comparison is case-insensitive for ASCII text by default.
      ? { companyName: { contains: search } }
      : {}

    const leads = await prisma.soharLead.findMany({
      where,
      orderBy: [
        { status: 'asc' }, // Pending first (P before C alphabetically)
        { createdAt: 'desc' },
      ],
    })

    const [total, pending, contacted] = await Promise.all([
      prisma.soharLead.count(),
      prisma.soharLead.count({ where: { status: 'Pending' } }),
      prisma.soharLead.count({ where: { status: 'Contacted' } }),
    ])

    return NextResponse.json({
      leads: leads ?? [],
      stats: { total, pending, contacted },
    })
  } catch (err: any) {
    console.error('Error fetching leads:', err)
    return NextResponse.json(
      { error: 'Failed to fetch leads', leads: [], stats: { total: 0, pending: 0, contacted: 0 } },
      { status: 500 }
    )
  }
}
