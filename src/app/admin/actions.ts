'use server'

import { createClient } from '@/utils/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export type InjectState = { ok: true } | { ok: false; error: string }

export async function injectIdea(formData: FormData): Promise<InjectState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdminEmail(user.email)) return { ok: false, error: 'Not authorized' }

  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const category = (formData.get('category') as string) || 'Tech'
  const status = (formData.get('status') as string) || 'Concept'
  const communityId = (formData.get('communityId') as string) || null

  if (!title?.trim() || !content?.trim()) {
    return { ok: false, error: 'Title and content are required.' }
  }

  const { error } = await supabase.rpc('admin_inject_idea', {
    p_title: title.trim(),
    p_content: content.trim(),
    p_content_html: null,
    p_category: category,
    p_status: status,
    p_community_id: communityId,
    p_required_roles: [],
  })

  if (error) {
    return {
      ok: false,
      error: /function .*admin_inject_idea/i.test(error.message)
        ? 'Migration 0003 has not been run. Execute supabase/migrations/0003_phase3_admin_moderation.sql in the Supabase SQL Editor first.'
        : error.message,
    }
  }

  revalidatePath('/')
  return { ok: true }
}

export async function approveIdea(ideaId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) redirect('/login')

  await supabase.rpc('approve_idea', { target_id: ideaId })
  revalidatePath('/admin')
}

export async function hideIdea(ideaId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) redirect('/login')

  await supabase.rpc('hide_idea', { target_id: ideaId })
  revalidatePath('/admin')
}
