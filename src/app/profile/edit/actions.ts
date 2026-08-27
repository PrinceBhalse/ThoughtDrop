'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const username = (formData.get('username') as string)?.trim().toLowerCase() || null
  const bio = (formData.get('bio') as string)?.trim() || null
  const website = (formData.get('website') as string)?.trim() || null

  // Uniqueness check: if username changed, verify it's not taken.
  if (username) {
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .neq('id', user.id)
      .maybeSingle()

    if (existing) {
      return 'error:That username is already taken.'
    }
  }

  const { error } = await supabase
    .from('users')
    .update({ username, bio, website })
    .eq('id', user.id)

  if (error) {
    return `error:${error.message}`
  }

  revalidatePath('/profile')
  revalidatePath('/profile/edit')
  return 'ok'
}
