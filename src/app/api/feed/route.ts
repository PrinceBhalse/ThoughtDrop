import { createClient } from '@/utils/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { getBlockedUserIds } from '@/lib/social'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 15

// Time-decay ranking: score = log(upvotes + 1) / (hours_since_creation + 2)^1.5
// This gives a nice balance between recency and popularity
function computeTrendingScore(upvotes: number, createdAt: string): number {
  const hoursSince = (Date.now() - new Date(createdAt).getTime()) / 3_600_000
  return Math.log10(upvotes + 1) / Math.pow(hoursSince + 2, 1.5)
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const before = request.nextUrl.searchParams.get('before')
  const category = request.nextUrl.searchParams.get('category')
  const sort = request.nextUrl.searchParams.get('sort') || 'newest'
  const rawLimit = Number(request.nextUrl.searchParams.get('limit') ?? PAGE_SIZE)
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 40) : PAGE_SIZE

  // Get current user for "following" sort + block filtering
  const { data: { user } } = await supabase.auth.getUser()

  const blockedIds = user ? await getBlockedUserIds(supabase) : []

  let query = supabase
    .from('ideas')
    .select('*, profiles:users(username), communities(name)')

  // Category filter (skip 'All')
  if (category && category !== 'All') {
    query = query.eq('category', category)
  }

  // Never surface content from blocked accounts
  if (blockedIds.length > 0) {
    query = query.not('user_id', 'in', `(${blockedIds.join(',')})`)
  }

  // Following sort - filter by followed users
  if (sort === 'following') {
    if (!user) {
      return NextResponse.json({ ideas: [], error: 'Authentication required' }, { status: 401 })
    }
    // Get followed user IDs
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)
    
    const followedIds = follows?.map(f => f.following_id) || []
    if (followedIds.length === 0) {
      return NextResponse.json({ ideas: [] })
    }
    query = query.in('user_id', followedIds).order('created_at', { ascending: false }).limit(limit)
  } else if (sort === 'trending') {
    // For trending, we need to fetch more rows to compute scores, then sort in JS
    // Fetch 100 most recent for scoring
    query = query.order('created_at', { ascending: false }).limit(100)
  } else if (sort === 'top') {
    query = query.order('upvotes_count', { ascending: false }).limit(limit)
  } else {
    // 'newest' - default
    query = query.order('created_at', { ascending: false }).limit(limit)
  }

  if (before && sort !== 'trending' && sort !== 'following') {
    query = query.lt('created_at', before)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ ideas: [], error: error.message }, { status: 500 })
  }

  let ideas = (data ?? []).filter((idea) => idea.is_hidden !== true)

  // Apply trending sort in JS
  if (sort === 'trending') {
    ideas = ideas
      .map((idea) => ({
        idea,
        score: computeTrendingScore(idea.upvotes_count || 0, idea.created_at),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((entry) => entry.idea)
  }

  // Apply cursor pagination for non-trending sorts
  if (before && sort !== 'trending' && sort !== 'following') {
    // Already handled by query.lt()
  } else if ((sort === 'trending' || sort === 'following') && before) {
    // For trending/following, cursor is based on created_at
    ideas = ideas.filter((idea) => new Date(idea.created_at).getTime() < new Date(before).getTime())
    ideas = ideas.slice(0, limit)
  }

  return NextResponse.json({ ideas })
}