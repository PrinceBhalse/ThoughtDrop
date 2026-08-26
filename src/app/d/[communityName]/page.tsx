import { createClient } from '@/utils/supabase/server'
import IdeaCard from '@/components/IdeaCard'
import Link from 'next/link'
import { Plus, Users } from 'lucide-react'
import { notFound } from 'next/navigation'
import { calculateAge } from '@/lib/utils'

export const dynamic = 'force-dynamic';

export default async function CommunityPage({ params }: { params: Promise<{ communityName: string }> }) {
  const { communityName } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch the community
  const { data: community } = await supabase
    .from('communities')
    .select('*')
    .eq('name', communityName)
    .single()

  if (!community) {
    notFound()
  }

  // Fetch ideas for this community
  const { data: ideas } = await supabase
    .from('ideas')
    .select(`
      *,
      profiles:users(username),
      communities(name)
    `)
    .eq('community_id', community.id)
    .order('created_at', { ascending: false })

  // Fetch user age for adult content filter
  let userAge = null;
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('date_of_birth')
      .eq('id', user.id)
      .single()
    
    if (profile?.date_of_birth) {
      userAge = calculateAge(profile.date_of_birth)
    }
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
      {/* Main Feed Area */}
      <div className="flex-1">
        <div className="glass-panel p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">/d/{community.name}</h1>
              <p className="text-muted-foreground">{community.description || 'A sub-drop for specialized thoughts.'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {ideas?.length === 0 ? (
            <div className="glass-panel p-12 text-center flex flex-col items-center justify-center">
              <h2 className="text-2xl font-bold mb-2">No ideas yet</h2>
              <p className="text-muted-foreground mb-6">Be the first to drop a thought in {community.name}!</p>
              <Link href={`/create?communityId=${community.id}`} className="primary-button">
                Create Idea
              </Link>
            </div>
          ) : (
            ideas?.map((idea) => (
              <IdeaCard 
                key={idea.id} 
                idea={idea} 
                userAge={userAge} 
                isAuthenticated={!!user} 
              />
            ))
          )}
        </div>
      </div>

      {/* Sidebar Area */}
      <div className="lg:w-80 space-y-6">
        <div className="glass-panel p-6 border-white/5">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Community Actions
          </h3>
          <Link href={`/create?communityId=${community.id}`} className="primary-button w-full flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            Submit Idea to /d/{community.name}
          </Link>
        </div>
      </div>
    </div>
  )
}
