import { prisma } from '@/lib/db'
import { DashboardClient } from '@/components/dashboard-client'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [totalCount, pendingCount, contactedCount] = await Promise.all([
    prisma.soharLead.count(),
    prisma.soharLead.count({ where: { status: 'Pending' } }),
    prisma.soharLead.count({ where: { status: 'Contacted' } }),
  ])

  return (
    <DashboardClient
      initialTotal={totalCount}
      initialPending={pendingCount}
      initialContacted={contactedCount}
    />
  )
}
