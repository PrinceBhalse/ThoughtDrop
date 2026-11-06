'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function completeProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const username = formData.get('username') as string
  const dob = formData.get('dob') as string
  const termsAccepted = formData.get('terms') === 'accepted'

  if (!termsAccepted) {
    redirect('/onboarding?error=terms')
  }

  const { error } = await supabase
    .from('users')
    .insert({
      id: user.id,
      username,
      date_of_birth: dob,
      terms_accepted_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Error completing profile:', error)
    // You could redirect to onboarding with an error query param
    redirect('/onboarding?error=true')
  }

  redirect('/')
}
