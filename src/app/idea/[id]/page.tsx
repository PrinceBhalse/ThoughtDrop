import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { ArrowUp, Lock, GitFork, User, Calendar, MessageSquare, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic';

export default async function IdeaDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: idea } = await supabase
    .from('ideas')
    .select(`
      *,
      profiles:users(username),
      communities(name)
    `)
    .eq('id', params.id)
    .single()

  if (!idea) {
    notFound()
  }

  let hasSignedNda = false;
  if (user && idea.is_nda_protected && idea.user_id !== user.id) {
    const { data: signature } = await supabase
      .from('nda_signatures')
      .select('id')
      .eq('idea_id', idea.id)
      .eq('user_id', user.id)
      .single()
    
    hasSignedNda = !!signature;
  } else if (user && idea.user_id === user.id) {
    hasSignedNda = true; // owner doesn't need to sign
  }

  // Handle NDA Action
  const signNdaAction = async () => {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('nda_signatures').insert({
        idea_id: idea.id,
        user_id: user.id
      })
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header section */}
      <div className="glass-panel p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary to-accent" />
        
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-primary/20 text-primary border border-primary/20">
            {idea.category}
          </span>
          <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/5 text-muted-foreground border border-white/10">
            Status: {idea.status}
          </span>
          {idea.parent_idea_id && (
            <Link href={`/idea/${idea.parent_idea_id}`} className="text-xs font-medium px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/20 flex items-center gap-1 hover:bg-green-500/30 transition-colors">
              <GitFork className="w-3 h-3" /> Forked from parent
            </Link>
          )}
        </div>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
          {idea.title}
        </h1>

        <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-white/10">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="w-5 h-5" />
            <span className="font-medium">
              {idea.is_anonymous || !idea.profiles ? "🕵️ Anonymous" : `@${idea.profiles.username}`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-5 h-5" />
            <span className="font-medium">
              {new Date(idea.created_at).toLocaleDateString()}
            </span>
          </div>
          
          <div className="flex-1" />
          
          <div className="flex items-center gap-3">
            <button className="glass-button">
              <ArrowUp className="w-4 h-4" />
              {idea.upvotes_count}
            </button>
            <Link href={`/create?parentId=${idea.id}`} className="primary-button">
              <GitFork className="w-4 h-4" />
              Fork Idea
            </Link>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="glass-panel p-8 relative">
        {idea.is_nda_protected && !hasSignedNda ? (
          <div className="text-center py-20 px-4">
            <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-blue-400" />
            </div>
            <h2 className="text-3xl font-bold mb-4">NDA Protected Blueprint</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
              The creator of this idea requires collaborators to sign a digital Non-Disclosure Agreement before viewing the full mechanics, code snippets, and business model.
            </p>
            {user ? (
              <form action={signNdaAction}>
                <button type="submit" className="primary-button mx-auto text-lg px-8 py-3">
                  Sign Digital NDA & View
                </button>
              </form>
            ) : (
              <Link href="/login" className="primary-button mx-auto w-fit text-lg px-8 py-3">
                Log in to Sign NDA
              </Link>
            )}
          </div>
        ) : (
          <div className="prose prose-invert prose-lg max-w-none">
            {idea.content_html ? (
              <div dangerouslySetInnerHTML={{ __html: idea.content_html }} />
            ) : (
              <div className="whitespace-pre-wrap">{idea.content}</div>
            )}
          </div>
        )}
      </div>

      {/* Discussion Section (Placeholder for Phase 2) */}
      <div className="glass-panel p-8">
        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" />
          Discussion
        </h3>
        <div className="text-center py-12 border border-white/5 border-dashed rounded-xl bg-white/5">
          <p className="text-muted-foreground">Comments and live workspaces are unlocking in Phase 2.</p>
        </div>
      </div>
    </div>
  )
}
