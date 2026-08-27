import { createClient } from '@/utils/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 15

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const before = request.nextUrl.searchParams.get('before') // ISO timestamp cursor
  const rawLimit = Number(request.nextUrl.searchParams.get('limit') ?? PAGE_SIZE)
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 40) : PAGE_SIZE

  let query = supabase
    .from('ideas')
    .select('*, profiles:users(username), communities(name)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (before) {
    query = query.lt('created_at', before)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ ideas: [], error: error.message }, { status: 500 })
  }

  const ideas = (data ?? []).filter((idea) => idea.is_hidden !== true)

  return NextResponse.json({ ideas })
}
