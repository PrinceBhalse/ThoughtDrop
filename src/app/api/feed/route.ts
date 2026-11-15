import { createClient } from '@/utils/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { getBlockedUserIds } from '@/lib/social'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 15
const INTENTS = new Set(['distract', 'inspire', 'catchup', 'learn'])

type IdeaRow = {
  id: string
  user_id?: string | null
  category: string
  created_at: string
  upvotes_count?: number
  is_hidden?: boolean
  [key: string]: unknown
}

// Time-decay ranking: score = log(upvotes + 1) / (hours_since_creation + 2)^1.5
// This gives a nice balance between recency and popularity
function computeTrendingScore(upvotes: number, createdAt: string): number {
  const hoursSince = (Date.now() - new Date(createdAt).getTime()) / 3_600_000
  return Math.log10(upvotes + 1) / Math.pow(hoursSince + 2, 1.5)
}

function parseIntent(raw: string | null): string | null {
  return raw && INTENTS.has(raw) ? raw : null
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const before = request.nextUrl.searchParams.get('before')
  const category = request.nextUrl.searchParams.get('category')
  const sort = request.nextUrl.searchParams.get('sort') || 'foryou'
  const intent = parseIntent(request.nextUrl.searchParams.get('intent'))
  const rawLimit = Number(request.nextUrl.searchParams.get('limit') ?? PAGE_SIZE)
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 40) : PAGE_SIZE

  // Get current user for "following" sort + personalization + block filtering
  const { data: { user } } = await supabase.auth.getUser()

  const blockedIds = user ? await getBlockedUserIds(supabase) : []

  // ---------------------------------------------------------------
  // For You: personalization + 70/30 exploration (Batch A)
  // ---------------------------------------------------------------
  if (sort === 'foryou') {
    const candidateLimit = Math.min(200, Math.max(60, limit * 8))

    let candidateQuery = supabase
      .from('ideas')
      .select('*, profiles:users(username), communities(name)')
      .order('created_at', { ascending: false })
      .limit(candidateLimit)

    if (category && category !== 'All') candidateQuery = candidateQuery.eq('category', category)
    if (blockedIds.length > 0) {
      candidateQuery = candidateQuery.not('user_id', 'in', `(${blockedIds.join(',')})`)
    }
    if (before) candidateQuery = candidateQuery.lt('created_at', before)

    const { data: rawData, error } = await candidateQuery
    if (error) {
      return NextResponse.json({ ideas: [], error: error.message }, { status: 500 })
    }

    const candidates = ((rawData ?? []) as IdeaRow[]).filter((idea) => idea.is_hidden !== true)

    // Anonymous visitors get a stable, recency-first feed.
    if (!user) {
      return NextResponse.json({
        ideas: candidates.slice(0, limit).map((idea) => ({ ...idea, reason: 'new' })),
      })
    }

    const since = new Date(Date.now() - 14 * 86_400_000).toISOString()

    const [{ data: follows }, { data: negative }, { data: profile }] = await Promise.all([
      supabase.from('follows').select('following_id').eq('follower_id', user.id),
      supabase
        .from('feed_events')
        .select('idea_id, metadata')
        .eq('user_id', user.id)
        .eq('event_type', 'show_less')
        .gte('created_at', since)
        .limit(500),
      supabase
        .from('users')
        .select('consent_personalization, interest_topics')
        .eq('id', user.id)
        .single(),
    ])

    const followed = new Set<string>((follows ?? []).map((f) => f.following_id as string))
    const suppressedIdeas = new Set<string>()
    const suppressedAuthors = new Map<string, number>()

    for (const event of negative ?? []) {
      if (event.idea_id) suppressedIdeas.add(event.idea_id as string)
      const meta = (event.metadata ?? {}) as { authorId?: unknown }
      if (typeof meta.authorId === 'string') {
        suppressedAuthors.set(meta.authorId, (suppressedAuthors.get(meta.authorId) ?? 0) + 1)
      }
    }

    const personalize = profile?.consent_personalization !== false
    const interests = new Set<string>((profile?.interest_topics ?? []) as string[])

    const intentCategoryBoost: Record<string, Record<string, number>> = {
      distract: { Creative: 0.2, 'Social Impact': 0.14 },
      inspire: { Business: 0.16, Creative: 0.14 },
      learn: { Tech: 0.24 },
      catchup: {},
    }

    const scored = candidates
      .filter((idea) => !suppressedIdeas.has(idea.id))
      .map((idea) => {
        let score = computeTrendingScore(idea.upvotes_count || 0, idea.created_at)
        let reason = 'trending'

        if (personalize) {
          if (idea.user_id && followed.has(idea.user_id)) {
            score += 0.3
            reason = 'following'
          }
          if (intent) score += intentCategoryBoost[intent]?.[idea.category] ?? 0
          if (interests.has(idea.category)) score += 0.08
          const authorHits = idea.user_id ? suppressedAuthors.get(idea.user_id) ?? 0 : 0
          score -= Math.min(0.7, authorHits * 0.25)
        }

        // Small jitter so the feed does not freeze into the same order.
        score *= 0.97 + Math.random() * 0.06
        return { idea, score, reason }
      })
      .sort((a, b) => b.score - a.score)

    const personalizedCount = Math.max(1, Math.round(limit * 0.7))
    const picked = scored.slice(0, personalizedCount)
    const rest = scored.slice(personalizedCount)
    const surpriseCount = Math.max(0, limit - picked.length)

    const surprises: typeof picked = []
    const step = Math.max(1, Math.floor(rest.length / Math.max(1, surpriseCount)))
    for (let i = 0; i < rest.length && surprises.length < surpriseCount; i += step) {
      surprises.push({ ...rest[i], reason: 'surprise' })
    }

    // Interleave one "safe surprise" every fourth slot.
    const merged: typeof picked = []
    let p = 0
    let s = 0
    for (let slot = 0; slot < limit; slot++) {
      if ((slot + 1) % 4 === 0 && s < surprises.length) {
        merged.push(surprises[s++])
      } else if (p < picked.length) {
        merged.push(picked[p++])
      } else if (s < surprises.length) {
        merged.push(surprises[s++])
      } else {
        break
      }
    }

    return NextResponse.json({
      ideas: merged.map((entry) => ({ ...entry.idea, reason: entry.reason })),
    })
  }

  // ---------------------------------------------------------------
  // Classic sorts (newest / trending / top / following)
  // ---------------------------------------------------------------
  let query = supabase
    .from('ideas')
    .select('*, profiles:users(username), communities(name)')

  if (category && category !== 'All') {
    query = query.eq('category', category)
  }

  if (blockedIds.length > 0) {
    query = query.not('user_id', 'in', `(${blockedIds.join(',')})`)
  }

  if (sort === 'following') {
    if (!user) {
      return NextResponse.json({ ideas: [], error: 'Authentication required' }, { status: 401 })
    }
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)

    const followedIds = follows?.map((f) => f.following_id) || []
    if (followedIds.length === 0) {
      return NextResponse.json({ ideas: [] })
    }
    query = query.in('user_id', followedIds).order('created_at', { ascending: false }).limit(limit)
  } else if (sort === 'trending') {
    query = query.order('created_at', { ascending: false }).limit(100)
  } else if (sort === 'top') {
    query = query.order('upvotes_count', { ascending: false }).limit(limit)
  } else {
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

  if (before && sort !== 'trending' && sort !== 'following') {
    // Already handled by query.lt()
  } else if ((sort === 'trending' || sort === 'following') && before) {
    ideas = ideas.filter((idea) => new Date(idea.created_at).getTime() < new Date(before).getTime())
    ideas = ideas.slice(0, limit)
  }

  const reason =
    sort === 'following' ? 'following'
    : sort === 'trending' ? 'trending'
    : sort === 'top' ? 'top'
    : 'new'

  return NextResponse.json({
    ideas: ideas.map((idea) => ({ ...idea, reason })),
  })
}
