'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bell, Building2, CheckCircle2, ExternalLink, Loader2, Phone, Search, Upload, Users, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { callHref } from '@/lib/leads/phone'
import type { Lead, LeadStats } from '../types'
import { ImportDialog } from './import-dialog'

type Props = { initialStats: LeadStats }
const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'Asia/Muscat' }).format(new Date(value)) : '—'
const isMobilePhone = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(navigator.userAgent))

export function LeadsDashboard({ initialStats }: Props) {
  const [leads, setLeads] = useState<Lead[]>([]); const [stats, setStats] = useState(initialStats)
  const [search, setSearch] = useState(''); const [loading, setLoading] = useState(true); const [importOpen, setImportOpen] = useState(false); const [contacting, setContacting] = useState<number | null>(null); const [calling, setCalling] = useState<number | null>(null); const [testingIphone, setTestingIphone] = useState(false)
  const load = useCallback(async (query = '') => {
    setLoading(true)
    try { const params = new URLSearchParams(); if (query) params.set('search', query); const result = await fetch(`/api/leads?${params}`); if (!result.ok) throw new Error(); const body = await result.json(); setLeads(body.leads); setStats(body.stats) }
    catch { toast.error('Could not load leads.') } finally { setLoading(false) }
  }, [])
  useEffect(() => { const id = setTimeout(() => load(search), 250); return () => clearTimeout(id) }, [load, search])
  async function markWhatsApp(lead: Lead) {
    if (!lead.phone) return; setContacting(lead.id)
    const message = `Hello ${lead.companyName} team, I'm Saleh, a developer in Sohar. I noticed your work in ${lead.category ?? 'your industry'} and would love to show you how a custom website could help your operations. Are you available for a brief chat?`
    window.open(`https://wa.me/${lead.phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
    try { const response = await fetch(`/api/leads/${lead.id}/contact`, { method: 'POST' }); if (!response.ok) throw new Error(); await load(search); toast.success(`${lead.companyName} marked as contacted`) }
    catch { toast.error('WhatsApp opened, but the contact status could not be saved.') } finally { setContacting(null) }
  }
  async function handoffCall(lead: Lead) {
    if (!lead.phone) return
    if (isMobilePhone()) { window.open(callHref(lead.phone), '_self'); return }
    setCalling(lead.id)
    try {
      const response = await fetch('/api/call-iphone', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: lead.phone, name: lead.companyName }) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? 'Unable to send the iPhone notification.')
      toast.success('Sent to iPhone')
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to send the iPhone notification.') } finally { setCalling(null) }
  }
  async function testIphone() {
    setTestingIphone(true)
    try {
      const response = await fetch('/api/call-iphone/test', { method: 'POST' }); const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? 'Unable to send the test notification.')
      toast.success('Test notification sent')
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to send the test notification.') } finally { setTestingIphone(false) }
  }
  const cards = [{ label: 'Total leads', value: stats.total, icon: Users }, { label: 'Pending', value: stats.pending, icon: Building2 }, { label: 'Contacted', value: stats.contacted, icon: CheckCircle2 }]
  return <div className="min-h-screen hero-gradient"><header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6"><h1 className="text-xl font-bold">Sohar Leads <span className="text-pink-400">CRM</span></h1><div className="flex gap-2"><Button variant="outline" size="sm" disabled={testingIphone} onClick={testIphone}>{testingIphone ? <Loader2 className="animate-spin" /> : <Bell />}Test iPhone</Button><Button onClick={() => setImportOpen(true)}><Upload />Import Excel</Button></div></div></header>
    <main className="mx-auto max-w-7xl p-4 sm:p-6"><section className="mb-6 grid gap-4 sm:grid-cols-3">{cards.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-xl border bg-card p-5"><Icon className="mb-3 h-5 w-5 text-pink-400" /><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold">{value}</p></div>)}</section>
      <div className="relative mb-6"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-10" placeholder="Search by company name…" /></div>
      <section className="overflow-hidden rounded-xl border bg-card">{loading ? <div className="flex justify-center gap-2 p-16 text-muted-foreground"><Loader2 className="animate-spin" />Loading leads…</div> : !leads.length ? <div className="p-16 text-center text-muted-foreground">{search ? 'No leads match your search.' : 'No leads yet — import an Excel file to get started.'}</div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="border-b bg-secondary/30 text-left text-muted-foreground"><tr>{['Company', 'Category', 'Phone', 'Website', 'Status', 'Last contacted', 'Actions'].map((header) => <th key={header} className="whitespace-nowrap px-4 py-3 font-medium">{header}</th>)}</tr></thead><tbody>{leads.map((lead) => <tr key={lead.id} className="border-b last:border-0 hover:bg-secondary/20"><td className="px-4 py-3 font-medium">{lead.companyName}</td><td className="px-4 py-3 text-muted-foreground">{lead.category ?? '—'}</td><td className="px-4 py-3 font-mono text-xs">{lead.phone ?? '—'}</td><td className="px-4 py-3">{lead.website ? <a className="inline-flex items-center gap-1 text-pink-400" target="_blank" rel="noreferrer" href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}><ExternalLink className="h-3 w-3" />Website</a> : '—'}</td><td className="px-4 py-3"><Badge variant="outline" className={lead.status === 'Contacted' ? 'text-emerald-400' : 'text-amber-400'}>{lead.status}</Badge></td><td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(lead.lastContacted)}</td><td className="px-4 py-3"><div className="flex gap-2"><Button size="sm" variant="outline" disabled={!lead.phone || calling === lead.id} onClick={() => handoffCall(lead)}>{calling === lead.id ? <Loader2 className="animate-spin" /> : <Phone />}Call number</Button><Button size="sm" disabled={!lead.phone || contacting === lead.id} onClick={() => markWhatsApp(lead)}>{contacting === lead.id ? <Loader2 className="animate-spin" /> : <MessageCircle />}WhatsApp</Button></div></td></tr>)}</tbody></table></div>}</section>
    </main><ImportDialog open={importOpen} onOpenChange={setImportOpen} onSuccess={() => { setImportOpen(false); load(search) }} /></div>
}
