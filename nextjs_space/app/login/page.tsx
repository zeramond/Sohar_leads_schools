'use client'

import { FormEvent, useState } from 'react'
import { Building2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const router = useRouter(); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError('')
    const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) })
    if (response.ok) router.replace('/'); else setError((await response.json()).error ?? 'Unable to sign in')
    setLoading(false)
  }
  return <main className="hero-gradient flex min-h-screen items-center justify-center p-4"><form onSubmit={submit} className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-lg">
    <Building2 className="mb-4 h-9 w-9 text-pink-400" /><h1 className="text-xl font-bold">Sohar Leads CRM</h1><p className="mb-5 text-sm text-muted-foreground">Sign in to manage your leads.</p>
    <label className="mb-2 block text-sm" htmlFor="password">Access password</label><Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
    {error && <p className="mt-3 text-sm text-red-400">{error}</p>}<Button className="mt-5 w-full" disabled={loading}>{loading && <Loader2 className="animate-spin" />}Sign in</Button>
  </form></main>
}
