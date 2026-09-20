import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const SESSION_COOKIE = 'sohar_crm_session'
const SESSION_VALUE = 'authenticated'

function sessionSecret() {
  const secret = process.env.CRM_SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('CRM_SESSION_SECRET must be set to a value of at least 32 characters.')
  }
  return secret
}

export function isAuthConfigured() {
  return Boolean(process.env.CRM_ACCESS_PASSWORD && process.env.CRM_SESSION_SECRET && process.env.CRM_SESSION_SECRET.length >= 32)
}

function signature(value: string) {
  return createHmac('sha256', sessionSecret()).update(value).digest('base64url')
}

function signedValue() {
  return `${SESSION_VALUE}.${signature(SESSION_VALUE)}`
}

export async function isAuthenticated() {
  if (!isAuthConfigured()) return false
  const value = (await cookies()).get(SESSION_COOKIE)?.value
  if (!value) return false

  const expected = signedValue()
  const actualBuffer = Buffer.from(value)
  const expectedBuffer = Buffer.from(expected)
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
}

export async function requireApiSession() {
  if (await isAuthenticated()) return null
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function setSession(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, signedValue(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  })
}

export function clearSession(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
}
