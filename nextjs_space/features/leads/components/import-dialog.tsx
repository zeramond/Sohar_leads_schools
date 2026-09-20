'use client'

import { useRef, useState } from 'react'
import { FileSpreadsheet, Loader2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type Props = { open: boolean; onOpenChange(open: boolean): void; onSuccess(): void }

export function ImportDialog({ open, onOpenChange, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const clear = () => { setFile(null); if (input.current) input.current.value = '' }

  async function upload() {
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData(); formData.append('file', file)
      const response = await fetch('/api/import', { method: 'POST', body: formData })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Import failed')
      toast.success(`${result.count} lead${result.count === 1 ? '' : 's'} imported`)
      clear(); onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Import failed')
    } finally { setUploading(false) }
  }

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="bg-card sm:max-w-md">
    <DialogHeader><DialogTitle>Import leads</DialogTitle><DialogDescription>Excel columns supported: Business, Category, Phone, Website.</DialogDescription></DialogHeader>
    <button type="button" onClick={() => input.current?.click()} className="rounded-xl border-2 border-dashed border-border p-8 text-center hover:border-pink-500">
      <FileSpreadsheet className="mx-auto mb-2 h-8 w-8 text-pink-400" />
      <span className="text-sm text-muted-foreground">{file?.name ?? 'Choose an .xlsx or .xls file'}</span>
      {file && <X className="ml-2 inline h-4 w-4" onClick={(event) => { event.stopPropagation(); clear() }} />}
    </button>
    <input ref={input} className="hidden" type="file" accept=".xlsx,.xls" onChange={(event) => {
      const next = event.target.files?.[0]; if (!next) return
      if (!/\.xlsx?$/i.test(next.name)) { toast.error('Please choose an Excel file'); clear(); return }
      setFile(next)
    }} />
    <Button onClick={upload} disabled={!file || uploading}>{uploading ? <Loader2 className="animate-spin" /> : <Upload />}{uploading ? 'Importing…' : 'Import leads'}</Button>
  </DialogContent></Dialog>
}
