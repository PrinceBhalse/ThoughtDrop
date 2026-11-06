"use client";

import { useState, useEffect } from "react";
import IdeaFeed from '@/components/IdeaFeed'
import EmptyState from '@/components/EmptyState'
import { type Idea } from '@/components/IdeaCard'
import { Coins } from 'lucide-react'

export default function Home() {
  const [category, setCategory] = useState("All")
  const [sort, setSort] = useState("newest")
  const [initialIdeas, setInitialIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userAge, setUserAge] = useState<number | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Load initial data and user session
  useEffect(() => {
    const loadInitial = async () => {
      try {
        const res = await fetch(`/api/feed?category=${encodeURIComponent(category)}&sort=${encodeURIComponent(sort)}&limit=15`)
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        setInitialIdeas(data.ideas || [])
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load")
      } finally {
        setLoading(false)
      }
    }
    loadInitial()

    // Check auth for age
    const checkAuth = async () => {
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('date_of_birth')
          .eq('id', user.id)
          .single()
        if (profile?.date_of_birth) {
          setUserAge(new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear())
        }
      }
    }
    checkAuth()
  }, [category, sort])

  if (loading) {
    return (
      <div className="flex flex-col gap-8">
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
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

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

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['All', 'Business', 'Creative', 'Tech', 'Social Impact'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${
                cat === category
                ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-secondary/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="trending">Trending</option>
            <option value="newest">Newest</option>
            <option value="top">Top Voted</option>
            {isAuthenticated && <option value="following">Following</option>}
          </select>
        </div>
      </div>

      {/* Feed Grid */}
      {error ? (
        <div className="text-center p-12 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400">
          Failed to load ideas. Please configure your database.
        </div>
      ) : initialIdeas && initialIdeas.length > 0 ? (
        <IdeaFeed
          initialIdeas={initialIdeas}
          userAge={userAge}
          isAuthenticated={isAuthenticated}
          category={category}
          sort={sort}
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