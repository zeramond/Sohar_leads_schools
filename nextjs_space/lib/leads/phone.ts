export function normalizePhone(raw: unknown): string | null {
  if (raw == null) return null
  let phone = String(raw).replace(/[\s\-()]/g, '')

  if (phone.startsWith('00968')) phone = `968${phone.slice(5)}`
  else if (phone.startsWith('+968')) phone = `968${phone.slice(4)}`
  else if (phone.startsWith('+')) phone = phone.slice(1)
  else if (phone.startsWith('0')) phone = `968${phone.slice(1)}`
  else if (/^\d{8}$/.test(phone)) phone = `968${phone}`

  return /^\d{8,15}$/.test(phone) ? phone : null
}

export function callHref(phone: string | null) {
  return phone ? `tel:+${phone}` : undefined
}
