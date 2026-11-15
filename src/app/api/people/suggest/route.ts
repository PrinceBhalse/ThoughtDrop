import { createClient } from '@/utils/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { getBlockedUserIds } from '@/lib/social'
import { getSuggestedPeople } from '@/lib/discovery'

export const dynamic = 'force-dynamic'

/**
 * "People you may know" (Batch B, item 8).
 *
 * Read-only and anonymous-safe: signed-out visitors get an empty list rather
 * than an error, so the home feed can render the module unconditionally.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ people: [] })
  }

  const rawLimit = Number(request.nextUrl.searchParams.get('limit') ?? 4)
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 12) : 4

  const blockedIds = await getBlockedUserIds(supabase)
  const people = await getSuggestedPeople(supabase, user.id, limit, blockedIds)

  return NextResponse.json({ people })
}
