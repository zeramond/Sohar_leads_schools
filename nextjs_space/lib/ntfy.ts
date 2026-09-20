type NtfyAction = {
  action: 'view'
  label: string
  url: string
  clear?: boolean
}

type NtfyMessage = {
  title: string
  message: string
  click?: string
  actions?: NtfyAction[]
  tags?: string[]
}

function ntfyConfig() {
  const serverUrl = process.env.NTFY_SERVER_URL?.replace(/\/+$/, '')
  const topic = process.env.NTFY_TOPIC
  if (!serverUrl || !topic) throw new Error('ntfy is not configured. Set NTFY_SERVER_URL and NTFY_TOPIC.')
  if (!/^https?:\/\//.test(serverUrl)) throw new Error('NTFY_SERVER_URL must start with http:// or https://.')
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(topic)) throw new Error('NTFY_TOPIC contains unsupported characters.')
  return { serverUrl, topic, token: process.env.NTFY_TOKEN?.trim() }
}

export function normalizeCallPhone(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  let phone = raw.trim().replace(/[\s()\-]/g, '')
  if (/^\d{8}$/.test(phone)) phone = `+968${phone}`
  else if (/^968\d{8}$/.test(phone)) phone = `+${phone}`
  else if (/^00968\d{8}$/.test(phone)) phone = `+${phone.slice(2)}`
  return /^\+\d{8,15}$/.test(phone) ? phone : null
}

export function displayCallPhone(phone: string) {
  const oman = phone.match(/^\+968(\d{2})(\d{3})(\d{3})$/)
  return oman ? `+968 ${oman[1]} ${oman[2]} ${oman[3]}` : phone
}

export async function publishNtfy(message: NtfyMessage) {
  const { serverUrl, topic, token } = ntfyConfig()
  const response = await fetch(`${serverUrl}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ topic, ...message }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`ntfy rejected the notification (${response.status}).`)
}

export async function sendIphoneCall(phone: string, leadName?: unknown) {
  const normalizedPhone = normalizeCallPhone(phone)
  if (!normalizedPhone) throw new Error('Enter a valid Oman or international phone number.')
  const name = typeof leadName === 'string' ? leadName.trim().slice(0, 80) : ''
  const telUri = `tel:${normalizedPhone}`
  await publishNtfy({
    title: `Call ${name || 'lead'}`,
    message: displayCallPhone(normalizedPhone),
    click: telUri,
    actions: [{ action: 'view', label: 'Call', url: telUri, clear: true }],
    tags: ['phone'],
  })
}
