import { createClient } from '@/utils/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

const INTENTS = new Set(['distract', 'inspire', 'catchup', 'learn'])

/**
 * Stores the user's session intent (the cold-start signal for the For You feed).
 * One row per session; the latest intent for a session wins in the feed query.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as
    | { sessionId?: string; intent?: string }
    | null

  const intent = body?.intent
  const sessionId = typeof body?.sessionId === 'string' ? body.sessionId.slice(0, 64) : null

  if (!sessionId || !intent || !INTENTS.has(intent)) {
    return NextResponse.json({ ok: false, error: 'Invalid intent' }, { status: 400 })
  }

  const { error } = await supabase.from('session_intents').insert({
    user_id: user.id,
    session_id: sessionId,
    intent,
  })

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, intent })
}
