import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import WorkspaceChat from '@/components/WorkspaceChat'
import WorkspacePresence from '@/components/WorkspacePresence'
import Link from 'next/link'
import { ArrowLeft, Users } from 'lucide-react'

export const dynamic = 'force-dynamic';

export default async function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: idea } = await supabase
    .from('ideas')
    .select('*, profiles:users(username)')
    .eq('id', id)
    .single()

  if (!idea) {
    notFound()
  }

  // Get current user's profile for presence tracking
  const { data: profile } = await supabase
    .from('users')
    .select('username')
    .eq('id', user.id)
    .single()

  // Workspaces are only available for "In Progress" ideas (or whatever logic you prefer)
  if (idea.status !== 'In Progress') {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <h1 className="text-3xl font-bold mb-4">Workspace Not Available</h1>
        <p className="text-muted-foreground mb-8">
          Workspaces are only active when an idea has the &quot;In Progress&quot; status.
        </p>
        <Link href={`/idea/${idea.id}`} className="primary-button">
          Go back to Idea
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/idea/${idea.id}`} className="text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Workspace: {idea.title}</h1>
            <p className="text-sm text-muted-foreground">Collaborate with the community to bring this idea to life.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Chat Section */}
        <div className="flex-1">
          <WorkspaceChat ideaId={idea.id} currentUserId={user.id} />
        </div>

        {/* Sidebar / Team Section */}
        <div className="lg:w-80 space-y-6 overflow-y-auto">
          <WorkspacePresence
            ideaId={idea.id}
            currentUserId={user.id}
            currentUsername={profile?.username || 'anonymous'}
          />

          <div className="glass-panel p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Needed Roles
            </h3>
            {idea.required_roles && idea.required_roles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {idea.required_roles.map((role: string, i: number) => (
                  <span key={i} className="text-xs font-medium px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/20">
                    {role}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No specific roles requested.</p>
            )}
          </div>
          
          <div className="glass-panel p-6">
             <h3 className="font-bold mb-2">Creator</h3>
             <p className="text-sm">@{idea.profiles?.username || 'Anonymous'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
