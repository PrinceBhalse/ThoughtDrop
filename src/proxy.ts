import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

// ── Simple in-memory sliding-window rate limiter ──
const windowMs = 60_000 // 1 minute
const limit = 30 // max requests per window per IP

const hits = new Map<string, number[]>()

function allow(ip: string): boolean {
  const now = Date.now()
  const ts = hits.get(ip) ?? []
  const recent = ts.filter((t) => now - t < windowMs)
  if (recent.length >= limit) {
    hits.set(ip, recent)
    return false
  }
  recent.push(now)
  hits.set(ip, recent)
  return true
}

const rateLimitedPaths = ['/api/search', '/api/feed']

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (rateLimitedPaths.some((p) => pathname.startsWith(p))) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      '127.0.0.1'

    if (!allow(ip)) {
      return NextResponse.json(
        { error: 'Too many requests — try again in a minute.' },
        { status: 429 },
      )
    }
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
