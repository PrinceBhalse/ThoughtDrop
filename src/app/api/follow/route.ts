import { createClient } from '@/utils/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Toggles a follow relationship.
 *
 * POST { target: "<user id>" } -> { following, followersCount }
 *
 * A POST is used because this mutates state; the previous GET implementation
 * could be triggered by link prefetching or crawlers.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const targetId = (body as { target?: string }).target

  if (!targetId) {
    return NextResponse.json({ error: 'Missing target user' }, { status: 400 })
  }

  if (targetId === user.id) {
    return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', targetId)
    .maybeSingle()

  let following: boolean

  if (existing) {
    await supabase.from('follows').delete().eq('id', existing.id)
    following = false
  } else {
    await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId })
    following = true
  }

  const { count: followersCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', targetId)

  return NextResponse.json({ following, followersCount: followersCount ?? 0 })
}
