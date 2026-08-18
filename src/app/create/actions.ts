'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function createIdea(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const title = formData.get('title') as string
  const contentHtml = formData.get('contentHtml') as string
  const content = formData.get('content') as string
  const category = formData.get('category') as string
  const status = formData.get('status') as string
  const isAnonymous = formData.get('isAnonymous') === 'true'
  const isAdult = formData.get('isAdult') === 'true'
  const isNdaProtected = formData.get('isNdaProtected') === 'true'
  const parentId = formData.get('parentId') as string
  const communityId = formData.get('communityId') as string
  const requiredRolesStr = formData.get('requiredRoles') as string
  
  const requiredRoles = requiredRolesStr ? requiredRolesStr.split(',').map(r => r.trim()).filter(Boolean) : []

  let userId = user?.id

  if (isAnonymous) {
    userId = undefined
  }

  const { error } = await supabase
    .from('ideas')
    .insert({
      user_id: userId,
      title,
      content,
      content_html: contentHtml,
      category,
      status,
      is_adult: isAdult,
      is_nda_protected: isNdaProtected,
      parent_idea_id: parentId || null,
      community_id: communityId || null,
      required_roles: requiredRoles,
    })

  if (error) {
    console.error('Error creating idea:', error)
    redirect('/create?error=true')
  }

  redirect('/')
}
