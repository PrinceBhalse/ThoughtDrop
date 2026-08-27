import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import IdeaCard, { type Idea } from '@/components/IdeaCard'
import { User, Activity, Bookmark, Settings } from 'lucide-react'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get Profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get User's Ideas
  const { data: ideas } = await supabase
    .from('ideas')
    .select(`
      *,
      profiles:users(username),
      communities(name)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="glass-panel p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-primary/20 to-accent/20" />
        <div className="relative pt-16 flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
          <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary to-accent border-4 border-background flex items-center justify-center text-white text-5xl font-bold shadow-xl">
            {profile?.username?.[0]?.toUpperCase() || <User size={48} />}
          </div>
          <div className="mb-2 flex-1">
            <h1 className="text-3xl font-bold tracking-tight">@{profile?.username || 'user'}</h1>
            <p className="text-muted-foreground flex gap-4 mt-2 justify-center sm:justify-start">
              <span className="flex items-center gap-1"><Activity className="w-4 h-4"/> {ideas?.length || 0} Ideas</span>
              <span className="flex items-center gap-1"><User className="w-4 h-4"/> 0 Followers</span>
            </p>
          </div>
          <Link
            href="/profile/edit"
            className="glass-button text-sm flex items-center gap-1.5"
          >
            <Settings className="w-4 h-4" />
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex gap-4 border-b border-white/10 pb-4">
        <button className="px-4 py-2 font-medium text-white border-b-2 border-primary flex items-center gap-2">
          <Activity className="w-4 h-4" /> Shared Ideas
        </button>
        <button className="px-4 py-2 font-medium text-muted-foreground hover:text-white transition-colors flex items-center gap-2">
          <Bookmark className="w-4 h-4" /> Saved Ideas
        </button>
      </div>

      {/* Ideas List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ideas && ideas.length > 0 ? (
          ideas.map((idea) => (
            <IdeaCard 
              key={idea.id} 
              idea={idea as Idea} 
              userAge={21} // We know the user is authenticated and this is their own profile, so they can see their own adult content or we skip the guard. Let's just pass 21 to bypass for their own items.
              isAuthenticated={true} 
            />
          ))
        ) : (
          <div className="col-span-2 text-center p-12 glass-panel">
            <p className="text-muted-foreground">You haven&apos;t shared any ideas yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
