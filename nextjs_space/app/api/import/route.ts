export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import * as XLSX from 'xlsx'
import { requireApiSession } from '@/lib/auth/session'
import { normalizePhone } from '@/lib/leads/phone'

export async function POST(request: NextRequest) {
  try {
    const unauthorized = await requireApiSession()
    if (unauthorized) return unauthorized
    const formData = await request?.formData?.()
    const file = formData?.get?.('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      return NextResponse.json({ error: 'Only Excel files (.xlsx or .xls) are supported' }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'The file must be 10 MB or smaller' }, { status: 413 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' })
    const sheetName = workbook?.SheetNames?.[0]
    if (!sheetName) {
      return NextResponse.json({ error: 'Empty workbook' }, { status: 400 })
    }

    const sheet = workbook?.Sheets?.[sheetName]
    const rows: any[] = XLSX.utils.sheet_to_json(sheet ?? {}, { defval: '' }) ?? []

    if ((rows?.length ?? 0) === 0) {
      return NextResponse.json({ error: 'No data found in the file' }, { status: 400 })
    }

    // Get existing phones to skip duplicates
    const existingLeads = await prisma.soharLead.findMany({
      select: { phone: true, companyName: true },
    })
    const existingPhones = new Set(
      (existingLeads ?? []).map((l: any) => l?.phone).filter(Boolean)
    )
    const existingNames = new Set(
      (existingLeads ?? []).map((l: any) => l?.companyName?.toLowerCase?.()).filter(Boolean)
    )

    const toInsert: Array<{
      companyName: string
      category: string | null
      phone: string | null
      website: string | null
    }> = []

    for (const row of rows) {
      const companyName = String(
        row?.['Business'] ?? row?.['business'] ?? row?.['Company'] ?? row?.['company'] ?? row?.['company_name'] ?? row?.['Company Name'] ?? ''
      ).trim()

      if (!companyName) continue

      const category = String(
        row?.['Category'] ?? row?.['category'] ?? ''
      ).trim() || null

      const rawPhone = row?.['Phone'] ?? row?.['phone'] ?? row?.['Phone Number'] ?? row?.['phone_number'] ?? ''
      const phone = normalizePhone(rawPhone)

      const website = String(
        row?.['Website'] ?? row?.['website'] ?? ''
      ).trim() || null

      // Skip duplicates by phone or company name
      if (phone && existingPhones.has(phone)) continue
      if (existingNames.has(companyName.toLowerCase())) continue

      // Also skip if already in this batch
      if (phone) existingPhones.add(phone)
      existingNames.add(companyName.toLowerCase())

      toInsert.push({ companyName, category, phone, website })
    }

    // Prisma does not support createMany({ skipDuplicates: true }) with SQLite.
    // Insert individually so the database's unique phone constraint still protects
    // against a concurrent import without failing the entire upload.
    let importedCount = 0
    for (const lead of toInsert) {
      try {
        await prisma.soharLead.create({ data: lead })
        importedCount += 1
      } catch (err: any) {
        if (err?.code !== 'P2002') throw err
      }
    }

    return NextResponse.json({
      count: importedCount,
      message: `Successfully imported ${importedCount} leads`,
    })
  } catch (err: any) {
    console.error('Import error:', err)
    return NextResponse.json(
      { error: err?.message ?? 'Failed to import file' },
      { status: 500 }
    )
  }
}
