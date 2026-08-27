'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function guardOwner(ideaId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: idea } = await supabase
    .from('ideas')
    .select('user_id')
    .eq('id', ideaId)
    .single()

  // Only the owner (auth.uid() === ideas.user_id) may edit/delete.
  return !!(idea && idea.user_id === user.id)
}

export async function updateIdea(formData: FormData): Promise<void> {
  const ideaId = formData.get('ideaId') as string
  if (!(await guardOwner(ideaId))) redirect('/login')

  const supabase = await createClient()
  const title = (formData.get('title') as string).trim()
  const content = (formData.get('content') as string).trim()
  const category = formData.get('category') as string
  const status = formData.get('status') as string

  if (!title || !content) {
    redirect(`/idea/${ideaId}/edit?error=missing`)
  }

  const { error } = await supabase
    .from('ideas')
    .update({ title, content, content_html: null, category, status })
    .eq('id', ideaId)

  revalidatePath(`/idea/${ideaId}`)
  revalidatePath('/')
  redirect(`/idea/${ideaId}${error ? '?error=save' : '?updated=1'}`)
}

export async function deleteIdea(formData: FormData): Promise<void> {
  const ideaId = formData.get('ideaId') as string
  const confirm = formData.get('confirm') as string
  if (!(await guardOwner(ideaId))) redirect('/login')

  // Require an explicit confirmation flag to prevent accidental deletes.
  if (confirm !== 'DELETE') {
    redirect(`/idea/${ideaId}/edit?error=confirm`)
  }

  const supabase = await createClient()
  await supabase.from('ideas').delete().eq('id', ideaId)

  revalidatePath('/')
  redirect('/?deleted=1')
}
