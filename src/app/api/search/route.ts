import { createClient } from '@/utils/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  const rawLimit = Number(request.nextUrl.searchParams.get('limit') ?? 8)
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 20) : 8

  if (!q) {
    return NextResponse.json({ ideas: [], communities: [] })
  }

  const supabase = await createClient()

  let ideas: { id: string; title: string; category: string; status: string }[] = []
  let communities: { id: string; name: string }[] = []

  // Full-text search (requires migration 0005's search_text + GIN indexes).
  const ideasRes = await supabase
    .from('ideas')
    .select('id, title, category, status')
    .textSearch('search_text', q, { type: 'websearch' })
    .limit(limit)

  if (!ideasRes.error) {
    ideas = ideasRes.data ?? []
  } else {
    // Fallback for pre-migration DBs: naive ILIKE across title/content.
    const fallback = await supabase
      .from('ideas')
      .select('id, title, category, status')
      .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
      .limit(limit)
    ideas = fallback.data ?? []
  }

  const communitiesRes = await supabase
    .from('communities')
    .select('id, name')
    .textSearch('search_text', q, { type: 'websearch' })
    .limit(limit)

  if (!communitiesRes.error) {
    communities = communitiesRes.data ?? []
  } else {
    const fallback = await supabase
      .from('communities')
      .select('id, name')
      .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
      .limit(limit)
    communities = fallback.data ?? []
  }

  // Hide reported content from results (is_hidden is undefined pre-migration).
  ideas = ideas.filter((idea) => (idea as unknown as { is_hidden?: boolean }).is_hidden !== true)

  return NextResponse.json({ ideas, communities })
}
