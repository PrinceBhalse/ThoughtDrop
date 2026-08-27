'use server'

import { createClient } from '@/utils/supabase/server'

export type ToggleUpvoteResult =
  | { ok: true; upvoted: boolean }
  | { ok: false; requiresAuth: boolean; error?: string }

export async function toggleUpvote(
  ideaId: string,
  currentCount: number
): Promise<ToggleUpvoteResult> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()

  if (!data.user) {
    return { ok: false, requiresAuth: true }
  }

  const { data: upvoted, error } = await supabase.rpc('toggle_upvote', {
    target_idea_id: ideaId,
  })

  if (error) {
    return { ok: false, requiresAuth: false, error: error.message }
  }

  void currentCount // resolved count is maintained server-side on ideas.upvotes_count
  return { ok: true, upvoted: upvoted === true }
}
