import { createClient } from '@/utils/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, Syringe, Flag, CircleCheck, CircleX } from 'lucide-react'
import { approveIdea, hideIdea } from './actions'
import InjectForm from './InjectForm'

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdminEmail(user.email)) {
    notFound()
  }

  // Communities for the inject form
  const { data: communities } = await supabase
    .from('communities')
    .select('id, name')

  // Review queue: currently-hidden ideas
  let hiddenIdeas: { id: string; title: string; category: string }[] = []
  let migrationApplied: boolean | null = null
  try {
    const { data, error } = await supabase
      .from('ideas')
      .select('id, title, category')
      .eq('is_hidden', true)
      .order('created_at', { ascending: false })
    hiddenIdeas = data ?? []
    migrationApplied = !error
  } catch {
    migrationApplied = false
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
        <p className="text-muted-foreground">Curate the pool and keep the feed healthy.</p>
      </header>

      {/* Migration notice */}
      {migrationApplied === false && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
          <strong>Migration 0003 pending.</strong> Run{' '}
          <code className="font-mono text-amber-100">supabase/migrations/0003_phase3_admin_moderation.sql</code>{' '}
          in the Supabase SQL Editor to enable injection, reporting, and auto-hiding.
        </div>
      )}

      {/* Injection */}
      <section className="glass-panel p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Syringe className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-white">Idea Injection</h2>
        </div>
        <InjectForm communities={communities ?? []} />
      </section>

      {/* Moderation queue */}
      <section className="glass-panel p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Flag className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold text-white">Moderation Queue</h2>
        </div>
        {hiddenIdeas.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hidden ideas awaiting review. All clear.</p>
        ) : (
          <ul className="space-y-3">
            {hiddenIdeas.map((idea) => (
              <li key={idea.id} className="flex items-center justify-between gap-4 rounded-lg bg-white/[0.03] border border-border px-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-white truncate">{idea.title}</p>
                  <p className="text-xs text-muted-foreground">{idea.category}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/idea/${idea.id}`} className="text-xs text-muted-foreground hover:text-foreground">
                    View
                  </Link>
                  <form action={approveIdea.bind(null, idea.id)}>
                    <button type="submit" className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1">
                      <CircleCheck className="w-4 h-4" /> Approve
                    </button>
                  </form>
                  <form action={hideIdea.bind(null, idea.id)}>
                    <button type="submit" className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                      <CircleX className="w-4 h-4" /> Keep hidden
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5" /> Admin access is gated by ADMIN_EMAILS in your environment.
      </p>
    </div>
  )
}
