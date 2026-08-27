import { createClient } from '@/utils/supabase/server'
import IdeaFeed from '@/components/IdeaFeed'
import EmptyState from '@/components/EmptyState'
import { calculateAge } from '@/lib/utils'
import { Coins } from 'lucide-react'

// Force dynamic to always fetch fresh data
export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient()
  
  // 1. Get Auth Session
  const { data: { user } } = await supabase.auth.getUser()
  
  // 2. Get User Profile for Age verification
  let userAge: number | null = null;
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

  // 3. Fetch first page of Ideas (Join with users to get username if not anonymous)
  const { data: ideasRaw, error } = await supabase
    .from('ideas')
    .select(`
      *,
      profiles:users(username),
      communities(name)
    `)
    .order('created_at', { ascending: false })
    .limit(15)

  // Filter out reported/hidden ideas. is_hidden is undefined until migration 0003 runs,
  // so treat only an explicit `true` as hidden — safe across both states.
  const ideas = ideasRaw?.filter((idea) => idea.is_hidden !== true) ?? []

  return (
    <div className="flex flex-col gap-8">
      {/* Header Section */}
      <section className="text-center space-y-6 py-12">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/50">
          Drop your thoughts.<br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Watch them ripple.
          </span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          The premium platform for sharing, validating, and collaborating on your next big idea.
        </p>
      </section>

      {/* Filters (Static for now, can be client-side filtered later) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['All', 'Business', 'Creative', 'Tech', 'Social Impact'].map((cat) => (
            <button 
              key={cat}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${
                cat === 'All' 
                ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
                : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <select className="bg-secondary/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
            <option>Trending</option>
            <option>Newest</option>
            <option>Top Voted</option>
          </select>
        </div>
      </div>

      {/* Feed Grid */}
      {error ? (
        <div className="text-center p-12 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400">
          Failed to load ideas. Please configure your database.
        </div>
      ) : ideas && ideas.length > 0 ? (
        <IdeaFeed
          initialIdeas={ideas}
          userAge={userAge}
          isAuthenticated={!!user}
        />
      ) : (
        <EmptyState
          icon={Coins}
          title="This feed is empty"
          line="No thoughts have been dropped yet. Every platform starts with one brave creator — why not you?"
          code="[] # No seeds found in ideas.pool"
          ctaLabel="Drop the first idea"
          ctaHref="/create"
          hint="The first few entries here will rumble loudly. Make yours count."
        />
      )}
    </div>
  )
}
