import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowUp, Lock, GitFork, User, Calendar, MessageSquare, Hash, Users } from 'lucide-react'
import Link from 'next/link'
import ShareButton from '@/components/ShareButton'
import ReportButton from '@/components/ReportButton'
import { isAdminEmail } from '@/lib/admin'

export const dynamic = 'force-dynamic';

interface IdeaPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: IdeaPageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: idea } = await supabase
    .from('ideas')
    .select('title, content, category, is_nda_protected, communities(name)')
    .eq('id', id)
    .single()

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const url = `${baseUrl}/idea/${id}`
  const title = idea ? `${idea.title} — ThoughtDrop` : 'ThoughtDrop'
  const description = idea
    ? `${idea.content?.slice(0, 160) ?? `${idea.category} idea.`}${idea.is_nda_protected ? ' [NDA protected]' : ''}`
    : 'Share and discover brilliant ideas.'

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      images: [{ url: `${baseUrl}/idea/${id}/opengraph-image` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function IdeaDetailPage({ params }: IdeaPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: idea } = await supabase
    .from('ideas')
    .select(`
      *,
      profiles:users(username),
      communities(name)
    `)
    .eq('id', id)
    .single()

  if (!idea) {
    notFound()
  }

  // Hide reported content from everyone except admins (who review it in /admin instead).
  const isAdmin = isAdminEmail(user?.email)
  if (idea.is_hidden === true && !isAdmin) {
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
          {idea.communities?.name && (
            <Link href={`/d/${idea.communities.name}`} className="text-xs font-medium px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/20 flex items-center gap-1 hover:bg-blue-500/30 transition-colors">
              <Hash className="w-3 h-3" /> /d/{idea.communities.name}
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
            <ShareButton
              title={idea.title}
              url={`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/idea/${idea.id}`}
            />
            <Link href={`/create?parentId=${idea.id}`} className="primary-button">
              <GitFork className="w-4 h-4" />
              Fork Idea
            </Link>
          </div>
        </div>
      </div>

      {/* Collaboration Section */}
      {(idea.status === 'In Progress' || (idea.required_roles && idea.required_roles.length > 0)) && (
        <div className="glass-panel p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex flex-col gap-2">
            {idea.required_roles && idea.required_roles.length > 0 && (
              <>
                <h3 className="font-bold flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-primary" /> Wanted Roles
                </h3>
                <div className="flex flex-wrap gap-2">
                  {idea.required_roles.map((role: string, i: number) => (
                    <span key={i} className="text-xs font-medium px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/20">
                      Need {role}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
          {idea.status === 'In Progress' && user && (
            <Link href={`/idea/${idea.id}/workspace`} className="primary-button shrink-0 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Join Workspace
            </Link>
          )}
        </div>
      )}

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

      {/* Discussion Section */}
      <div className="glass-panel p-8">
        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" />
          Discussion
        </h3>
        {idea.status === 'In Progress' ? (
          <div className="flex flex-col items-center py-12 border border-white/5 border-dashed rounded-xl bg-white/5">
            <p className="text-muted-foreground mb-6">
              This idea is In Progress — the live workspace chat is open.
            </p>
            {user ? (
              <Link href={`/idea/${idea.id}/workspace`} className="primary-button flex items-center gap-2">
                <Users className="w-4 h-4" /> Enter Live Workspace
              </Link>
            ) : (
              <Link href="/login" className="primary-button">Log in to Join</Link>
            )}
          </div>
        ) : (
          <div className="text-center py-12 border border-white/5 border-dashed rounded-xl bg-white/5">
            <p className="text-muted-foreground">Threaded comments are coming soon.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">
          Keeping the feed healthy is on all of us.
        </p>
        {user && user.id !== idea.user_id && <ReportButton ideaId={idea.id} />}
      </div>
    </div>
  )
}
