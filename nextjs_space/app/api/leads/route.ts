export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request?.nextUrl?.searchParams
    const search = searchParams?.get?.('search') ?? ''

    const where = search
      ? { companyName: { contains: search, mode: 'insensitive' as const } }
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
