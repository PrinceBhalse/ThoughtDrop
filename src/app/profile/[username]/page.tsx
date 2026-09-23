import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import IdeaCard, { type Idea } from '@/components/IdeaCard'
import { User, Activity, Bookmark, Award, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface PublicProfilePageProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: PublicProfilePageProps): Promise<Metadata> {
  const { username } = await params
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('users')
    .select('username, bio, website, created_at')
    .eq('username', username)
    .single()

  if (!profile) return { title: 'Profile not found' }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return {
    title: `@${profile.username} — ThoughtDrop`,
    description: profile.bio || `Explore ${profile.username}'s ideas on ThoughtDrop`,
    openGraph: {
      title: `@${profile.username}`,
      description: profile.bio || `Explore ${profile.username}'s ideas on ThoughtDrop`,
      type: 'profile',
      profile: {
        username: profile.username,
      },
    } as any,
  }
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { username } = await params
  const supabase = await createClient()

  // Get target profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  // Check if current user is viewing their own profile
  const { data: { user } } = await supabase.auth.getUser()
  const isOwnProfile = user?.id === profile.id

  // Get user's ideas
  const { data: ideas } = await supabase
    .from('ideas')
    .select(`
      *,
      profiles:users(username),
      communities(name)
    `)
    .eq('user_id', profile.id)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })

  // Get follower/following counts
  const [{ count: followersCount }, { count: followingCount }] = await Promise.all([
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
  ])

  // Check if current user follows this profile
  let isFollowing = false
  if (user && !isOwnProfile) {
    const { data: follow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', profile.id)
      .maybeSingle()
    isFollowing = !!follow
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="glass-panel p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-primary/20 to-accent/20" />
        <div className="relative pt-16 flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
          <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary to-accent border-4 border-background flex items-center justify-center text-white text-5xl font-bold shadow-xl">
            {profile.username?.[0]?.toUpperCase() || <User size={48} />}
          </div>
          <div className="mb-2 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">@{profile.username || 'user'}</h1>
              {isOwnProfile && (
                <Link href="/profile/edit" className="glass-button text-sm flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  Edit Profile
                </Link>
              )}
            </div>
            {profile.bio && <p className="text-muted-foreground mt-2 max-w-2xl">{profile.bio}</p>}
            {profile.website && (
              <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} 
                 target="_blank" rel="noopener noreferrer" 
                 className="text-primary hover:underline text-sm mt-2 inline-flex items-center gap-1">
                <ExternalLink className="w-4 h-4" />
                {profile.website}
              </a>
            )}
            <p className="text-muted-foreground flex gap-4 mt-4 justify-center sm:justify-start">
              <span className="flex items-center gap-1"><Activity className="w-4 h-4"/> {ideas?.length || 0} Ideas</span>
              <span className="flex items-center gap-1"><User className="w-4 h-4"/> {followersCount || 0} Followers</span>
              <span className="flex items-center gap-1"><User className="w-4 h-4"/> {followingCount || 0} Following</span>
            </p>
          </div>
          {!isOwnProfile && user && (
            <button 
              id="follow-btn"
              onClick={() => window.location.href = `/api/follow?target=${profile.id}`}
              className={`shrink-0 px-4 py-2 rounded-lg font-medium transition-colors ${
                isFollowing 
                  ? 'bg-white/5 text-muted-foreground hover:bg-red-500/20 hover:text-red-400 border border-white/10' 
                  : 'primary-button'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex gap-4 border-b border-white/10 pb-4">
        <button className="px-4 py-2 font-medium text-white border-b-2 border-primary flex items-center gap-2">
          <Activity className="w-4 h-4" /> Ideas ({ideas?.length || 0})
        </button>
        <button className="px-4 py-2 font-medium text-muted-foreground hover:text-white transition-colors flex items-center gap-2">
          <Award className="w-4 h-4" /> Badges
        </button>
      </div>

      {/* Ideas List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ideas && ideas.length > 0 ? (
          ideas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea as Idea}
              userAge={21}
              isAuthenticated={!!user}
            />
          ))
        ) : (
          <div className="col-span-2 text-center p-12 glass-panel">
            <p className="text-muted-foreground">
              {isOwnProfile 
                ? "You haven't shared any ideas yet." 
                : `@${username} hasn't shared any ideas yet.`
              }
            </p>
            {isOwnProfile && (
              <Link href="/create" className="primary-button mt-4 inline-block">
                Drop your first idea
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}