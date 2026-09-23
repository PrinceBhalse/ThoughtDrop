'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleBookmark(ideaId: string): Promise<{ bookmarked: boolean } | string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return 'error:Please log in to bookmark'

  const { data: existing } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', user.id)
    .eq('idea_id', ideaId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase.from('bookmarks').delete().eq('id', existing.id)
    if (error) return `error:${error.message}`
    revalidatePath('/profile')
    return { bookmarked: false }
  } else {
    const { error } = await supabase.from('bookmarks').insert({ user_id: user.id, idea_id: ideaId })
    if (error) return `error:${error.message}`
    revalidatePath('/profile')
    return { bookmarked: true }
  }
}

export async function getBookmarks(): Promise<{ idea_id: string }[] | string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return 'error:Not authenticated'

  const { data, error } = await supabase
    .from('bookmarks')
    .select('idea_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return `error:${error.message}`
  return data ?? []
}