import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { isAuthenticated } from '@/lib/auth/session'
import { LeadsDashboard } from '@/features/leads/components/leads-dashboard'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  if (!(await isAuthenticated())) redirect('/login')
  const [totalCount, pendingCount, contactedCount] = await Promise.all([
    prisma.soharLead.count(),
    prisma.soharLead.count({ where: { status: 'Pending' } }),
    prisma.soharLead.count({ where: { status: 'Contacted' } }),
  ])

  return (
    <LeadsDashboard initialStats={{ total: totalCount, pending: pendingCount, contacted: contactedCount }} />
  )
}
