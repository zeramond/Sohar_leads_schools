export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import * as XLSX from 'xlsx'

function normalizePhone(raw: any): string {
  if (raw == null) return ''
  let phone = String(raw).replace(/[\s\-\(\)]/g, '')

  if (phone.startsWith('00968')) {
    phone = '968' + phone.slice(5)
  } else if (phone.startsWith('+968')) {
    phone = '968' + phone.slice(4)
  } else if (phone.startsWith('+')) {
    phone = phone.slice(1)
  } else if (phone.startsWith('968')) {
    // already correct
  } else if (phone.startsWith('0')) {
    phone = '968' + phone.slice(1)
  } else if (/^\d{8}$/.test(phone)) {
    phone = '968' + phone
  }

  return phone
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request?.formData?.()
    const file = formData?.get?.('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
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
      const phone = normalizePhone(rawPhone) || null

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

    if (toInsert.length > 0) {
      // Batch insert in chunks of 500
      const chunkSize = 500
      for (let i = 0; i < toInsert.length; i += chunkSize) {
        const chunk = toInsert.slice(i, i + chunkSize)
        await prisma.soharLead.createMany({
          data: chunk,
          skipDuplicates: true,
        })
      }
    }

    return NextResponse.json({
      count: toInsert.length,
      message: `Successfully imported ${toInsert.length} leads`,
    })
  } catch (err: any) {
    console.error('Import error:', err)
    return NextResponse.json(
      { error: err?.message ?? 'Failed to import file' },
      { status: 500 }
    )
  }
}
