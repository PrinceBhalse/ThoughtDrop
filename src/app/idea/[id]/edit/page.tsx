import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { updateIdea, deleteIdea } from './actions'

export const dynamic = 'force-dynamic';

export default async function EditIdeaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params
  const { error } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: idea } = await supabase
    .from('ideas')
    .select('*')
    .eq('id', id)
    .single()

  if (!idea) notFound()

  // Owner enforcement: auth.uid() === idea.user_id.
  if (!user || idea.user_id !== user.id) {
    redirect(`/idea/${id}`)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href={`/idea/${id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to idea
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit idea</h1>
        <p className="text-muted-foreground mt-1">Only the author can modify this blueprint.</p>
      </div>

      {error === 'missing' && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Title and content are required.
        </div>
      )}

      <form action={updateIdea} className="glass-panel p-6 space-y-5">
        <input type="hidden" name="ideaId" value={idea.id} />
        <div>
          <label className="block text-sm font-medium mb-1.5 text-muted-foreground" htmlFor="title">Title</label>
          <input
            type="text" id="title" name="title" required defaultValue={idea.title}
            className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5 text-muted-foreground" htmlFor="content">Content</label>
          <textarea
            id="content" name="content" required rows={8} defaultValue={idea.content}
            className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary resize-y"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground" htmlFor="category">Category</label>
            <select id="category" name="category" defaultValue={idea.category} className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5">
              <option>Business</option><option>Creative</option><option>Tech</option><option>Social Impact</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground" htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue={idea.status} className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5">
              <option>Concept</option><option>In Progress</option><option>Seeking Collaborators</option><option>Launched</option>
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <button type="submit" className="primary-button">Save changes</button>
        </div>
      </form>

      {/* Delete section */}
      <div className="glass-panel p-6">
        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2 text-red-300">
          <Trash2 className="w-4 h-4" /> Danger zone
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Deleting an idea is permanent and cannot be undone.
        </p>
        <form action={deleteIdea} className="flex flex-col sm:flex-row sm:items-center gap-3">
          <input type="hidden" name="ideaId" value={idea.id} />
          <label htmlFor="confirm" className="text-sm text-muted-foreground shrink-0">
            Type <code className="font-mono text-foreground">DELETE</code> to confirm:
          </label>
          <input
            type="text" id="confirm" name="confirm" required placeholder="DELETE"
            className="flex-1 bg-secondary border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/50"
          />
          <button type="submit" className="rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 px-4 py-2 text-sm font-medium transition-colors">
            Delete idea
          </button>
        </form>
      </div>
    </div>
  )
}
