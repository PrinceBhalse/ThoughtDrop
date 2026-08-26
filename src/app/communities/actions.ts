'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 50)
}

export async function createCommunity(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const rawName = formData.get('name') as string
  const description = formData.get('description') as string

  if (!rawName?.trim()) {
    redirect('/communities?error=true')
  }

  const name = slugify(rawName)

  if (!name) {
    redirect('/communities?error=true')
  }

  // Ensure the profile row exists before referencing it via created_by
  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single()

  const { error } = await supabase
    .from('communities')
    .insert({
      name,
      description: description?.trim() || null,
      created_by: profile?.id || null,
    })

  if (error) {
    console.error('Error creating community:', error)
    redirect('/communities?error=true')
  }

  redirect(`/d/${name}`)
}
