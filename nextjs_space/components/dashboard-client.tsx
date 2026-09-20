'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Upload, MessageCircle, Building2, Clock, CheckCircle2, Users, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ImportModal } from '@/components/import-modal'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface Lead {
  id: number
  companyName: string
  category: string | null
  phone: string | null
  website: string | null
  status: string
  lastContacted: string | null
  createdAt: string
}

interface DashboardClientProps {
  initialTotal: number
  initialPending: number
  initialContacted: number
}

export function DashboardClient({ initialTotal, initialPending, initialContacted }: DashboardClientProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [importOpen, setImportOpen] = useState(false)
  const [contactingId, setContactingId] = useState<number | null>(null)
  const [stats, setStats] = useState({
    total: initialTotal,
    pending: initialPending,
    contacted: initialContacted,
  })

  const fetchLeads = useCallback(async (searchQuery?: string) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      const res = await fetch(`/api/leads?${params.toString()}`)
      if (!res?.ok) throw new Error('Failed to fetch leads')
      const data = await res.json()
      setLeads(data?.leads ?? [])
      if (data?.stats) {
        setStats({
          total: data.stats.total ?? 0,
          pending: data.stats.pending ?? 0,
          contacted: data.stats.contacted ?? 0,
        })
      }
    } catch (err: any) {
      console.error('Error fetching leads:', err)
      toast.error('Failed to load leads')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, fetchLeads])

  const handleWhatsApp = async (lead: Lead) => {
    if (!lead?.phone) {
      toast.error('No phone number for this lead')
      return
    }
    setContactingId(lead.id)

    const message = `Hello ${lead.companyName ?? 'there'} team, I'm Saleh, a developer in Sohar. I built the systems for BO Bowling and Rakeez Clinic. I noticed your work in ${lead.category ?? 'your industry'} and would love to show you how a custom website could help your operations. Are you available for a brief chat?`
    const url = `https://api.whatsapp.com/send?phone=${lead.phone}&text=${encodeURIComponent(message)}`
    window.open(url, '_blank')

    try {
      const res = await fetch(`/api/leads/${lead.id}/contact`, { method: 'POST' })
      if (res?.ok) {
        setLeads((prev) =>
          (prev ?? []).map((l: Lead) =>
            l?.id === lead.id
              ? { ...(l ?? {}), status: 'Contacted', lastContacted: new Date().toISOString() }
              : l
          )
        )
        setStats((prev) => ({
          ...(prev ?? {}),
          pending: Math.max(0, (prev?.pending ?? 0) - (lead.status === 'Pending' ? 1 : 0)),
          contacted: (prev?.contacted ?? 0) + (lead.status === 'Pending' ? 1 : 0),
        }))
        toast.success(`Marked ${lead.companyName} as contacted`)
      }
    } catch (err: any) {
      console.error('Error marking contact:', err)
    } finally {
      setContactingId(null)
    }
  }

  const handleImportSuccess = () => {
    setImportOpen(false)
    fetchLeads(search)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'Asia/Muscat',
      })
    } catch {
      return '—'
    }
  }

  return (
    <div className="min-h-screen bg-background hero-gradient">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pink-500/20">
              <Building2 className="h-5 w-5 text-pink-400" />
            </div>
            <h1 className="font-display text-xl font-bold tracking-tight text-white">
              Sohar Leads <span className="text-pink-400">CRM</span>
            </h1>
          </div>
          <Button
            onClick={() => setImportOpen(true)}
            className="bg-pink-500 hover:bg-pink-600 text-white"
          >
            <Upload className="h-4 w-4" />
            Import Excel
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Stat Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="rounded-xl border border-border/50 bg-card p-5"
            style={{ boxShadow: 'var(--shadow-md)' }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold font-mono text-white">{stats?.total ?? 0}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border/50 bg-card p-5"
            style={{ boxShadow: 'var(--shadow-md)' }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold font-mono text-amber-400">{stats?.pending ?? 0}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-border/50 bg-card p-5"
            style={{ boxShadow: 'var(--shadow-md)' }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contacted</p>
                <p className="text-2xl font-bold font-mono text-emerald-400">{stats?.contacted ?? 0}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by company name..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e?.target?.value ?? '')}
              className="pl-10 bg-card border-border/50 h-11"
            />
          </div>
        </div>

        {/* Leads Table */}
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden" style={{ boxShadow: 'var(--shadow-md)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-pink-400" />
              <span className="ml-2 text-muted-foreground">Loading leads...</span>
            </div>
          ) : (leads?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Building2 className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                {search ? 'No leads match your search' : 'No leads yet — import an Excel file to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-secondary/30">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Company</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Phone</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Website</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Last Contacted</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {(leads ?? []).map((lead: Lead, idx: number) => (
                      <motion.tr
                        key={lead?.id ?? idx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(idx * 0.02, 0.5) }}
                        className="border-b border-border/30 transition-colors hover:bg-secondary/20"
                      >
                        <td className="px-4 py-3 font-medium text-white">
                          {lead?.companyName ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {lead?.category ?? '—'}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {lead?.phone ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          {lead?.website ? (
                            <a
                              href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-pink-400 hover:text-pink-300 transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span className="max-w-[120px] truncate">{lead.website?.replace?.(/^https?:\/\//, '') ?? ''}</span>
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {lead?.status === 'Contacted' ? (
                            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25">
                              Contacted
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25">
                              Pending
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {formatDate(lead?.lastContacted ?? null)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            disabled={!lead?.phone || contactingId === lead?.id}
                            onClick={() => handleWhatsApp(lead)}
                            className="bg-pink-500 hover:bg-pink-600 text-white text-xs"
                          >
                            {contactingId === lead?.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <MessageCircle className="h-3 w-3" />
                            )}
                            WhatsApp
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <ImportModal
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={handleImportSuccess}
      />
    </div>
  )
}
