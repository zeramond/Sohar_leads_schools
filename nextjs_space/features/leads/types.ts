export type Lead = {
  id: number
  companyName: string
  category: string | null
  phone: string | null
  website: string | null
  status: 'Pending' | 'Contacted'
  lastContacted: string | null
  createdAt: string
}

export type LeadStats = { total: number; pending: number; contacted: number }
