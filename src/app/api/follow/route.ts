import { createClient } from '@/utils/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const targetId = request.nextUrl.searchParams.get('target')
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

  const referer = request.headers.get('referer') || `/profile/${targetId}`
  return NextResponse.redirect(referer)
}