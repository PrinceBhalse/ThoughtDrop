import { createClient } from '@/utils/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

const ALLOWED_EVENTS = new Set([
  'impression', 'click', 'dwell', 'like', 'unlike', 'save', 'unsave',
  'share', 'skip', 'show_less', 'follow', 'unfollow', 'search',
])

const ALLOWED_SURFACES = new Set(['home', 'search', 'profile', 'community', 'idea', 'other'])

const MAX_BATCH = 40
const MAX_METADATA_BYTES = 2000

interface IncomingEvent {
  ideaId?: string | null
  eventType?: string
  surface?: string
  sessionId?: string | null
  dwellMs?: number | null
  metadata?: Record<string, unknown>
}

/**
 * Batched, fire-and-forget ingestion for feed signals (migration 0015).
 * Only the signed-in user's own events are accepted; RLS enforces the same.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as { events?: IncomingEvent[] } | null
  const incoming = Array.isArray(body?.events) ? body.events.slice(0, MAX_BATCH) : []

  const rows = incoming
    .filter((event) => !!event && typeof event.eventType === 'string' && ALLOWED_EVENTS.has(event.eventType))
    .map((event) => {
      const metadata = event.metadata && typeof event.metadata === 'object' ? event.metadata : {}
      let serialized = JSON.stringify(metadata)
      if (serialized.length > MAX_METADATA_BYTES) serialized = '{}'
      const dwell = typeof event.dwellMs === 'number' && Number.isFinite(event.dwellMs)
        ? Math.max(0, Math.min(86_400_000, Math.round(event.dwellMs)))
        : null
      return {
        user_id: user.id,
        idea_id: typeof event.ideaId === 'string' && event.ideaId.length > 0 ? event.ideaId : null,
        event_type: event.eventType as string,
        surface: typeof event.surface === 'string' && ALLOWED_SURFACES.has(event.surface) ? event.surface : 'home',
        session_id: typeof event.sessionId === 'string' ? event.sessionId.slice(0, 64) : null,
        dwell_ms: dwell,
        metadata: JSON.parse(serialized),
      }
    })

  if (rows.length === 0) {
    return NextResponse.json({ ok: true, inserted: 0 })
  }

  const { error } = await supabase.from('feed_events').insert(rows)
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, inserted: rows.length })
}
