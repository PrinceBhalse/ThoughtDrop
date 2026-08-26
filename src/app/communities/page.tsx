import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Hash, Users, Plus } from 'lucide-react'
import CreateCommunityForm from '@/components/CreateCommunityForm'

export const dynamic = 'force-dynamic';

export default async function CommunitiesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: communities } = await supabase
    .from('communities')
    .select('*, ideas(count)')
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <section className="text-center space-y-4 py-8">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter">
          Micro-<span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Communities</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Discover Sub-Drops — focused spaces where ideas in a domain ripple together.
        </p>
      </section>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Community Grid */}
        <div className="flex-1 w-full">
          {communities && communities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {communities.map((community) => {
                const ideaCount = (community.ideas as unknown as { count: number }[])?.[0]?.count ?? 0
                return (
                  <Link
                    key={community.id}
                    href={`/d/${community.name}`}
                    className="glass-panel p-6 group hover:border-primary/30 transition-all relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent opacity-50 group-hover:opacity-100 transition-opacity" />
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                      <Hash className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight mb-2 group-hover:text-primary transition-colors">
                      /d/{community.name}
                    </h2>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-10">
                      {community.description || 'A sub-drop for specialized thoughts.'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-white/10 pt-4">
                      <Users className="w-3.5 h-3.5" />
                      <span>{ideaCount} {ideaCount === 1 ? 'idea' : 'ideas'}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="glass-panel p-12 text-center flex flex-col items-center justify-center">
              <h2 className="text-2xl font-bold mb-2">No communities yet</h2>
              <p className="text-muted-foreground mb-6">Be the first to carve out a space for your domain.</p>
            </div>
          )}
        </div>

        {/* Create Sidebar */}
        <div className="lg:w-80 w-full space-y-6">
          <div className="glass-panel p-6 border-primary/30 shadow-[0_0_20px_rgba(139,92,246,0.1)]">
            <h3 className="font-bold text-lg mb-2">Start a Sub-Drop</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Any member can create a community. Names are lowercase with no spaces.
            </p>
            {user ? (
              <CreateCommunityForm />
            ) : (
              <Link href="/login" className="primary-button w-full flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                Log in to Create
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
