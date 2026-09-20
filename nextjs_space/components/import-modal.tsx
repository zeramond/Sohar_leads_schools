'use client'

import { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface ImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ImportModal({ open, onOpenChange, onSuccess }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e?.target?.files?.[0] ?? null
    if (selected) {
      const ext = selected.name?.split?.('.')?.pop?.()?.toLowerCase?.() ?? ''
      if (!['xlsx', 'xls'].includes(ext)) {
        toast.error('Please select an Excel file (.xlsx or .xls)')
        return
      }
      setFile(selected)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      })
      const data = await res?.json?.()
      if (!res?.ok) {
        throw new Error(data?.error ?? 'Import failed')
      }
      toast.success(`Successfully imported ${data?.count ?? 0} leads`)
      setFile(null)
      if (fileRef?.current) fileRef.current.value = ''
      onSuccess?.()
    } catch (err: any) {
      console.error('Import error:', err)
      toast.error(err?.message ?? 'Failed to import file')
    } finally {
      setUploading(false)
    }
  }

  const handleClear = () => {
    setFile(null)
    if (fileRef?.current) fileRef.current.value = ''
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border/50 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <FileSpreadsheet className="h-5 w-5 text-pink-400" />
            Import Leads from Excel
          </DialogTitle>
          <DialogDescription>
            Upload an Excel file with columns: Business, Category, Phone, Website.
            Duplicate entries (by phone number) will be skipped.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Drop zone */}
          <div
            className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 bg-secondary/20 px-6 py-8 transition-colors hover:border-pink-500/40 hover:bg-secondary/30 cursor-pointer"
            onClick={() => fileRef?.current?.click?.()}
          >
            <Upload className="mb-2 h-8 w-8 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              {file ? '' : 'Click to select an Excel file'}
            </p>
            {file && (
              <div className="flex items-center gap-2 rounded-lg bg-pink-500/10 px-3 py-2 mt-1">
                <FileSpreadsheet className="h-4 w-4 text-pink-400" />
                <span className="text-sm text-white max-w-[200px] truncate">
                  {file.name}
                </span>
                <button
                  onClick={(e: React.MouseEvent) => {
                    e?.stopPropagation?.()
                    handleClear()
                  }}
                  className="ml-1 rounded p-0.5 hover:bg-white/10 transition-colors"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Import Leads
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
