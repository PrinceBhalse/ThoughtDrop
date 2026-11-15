import Link from "next/link";
import { ArrowUpRight, GitFork, Hash } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getBlockedUserIds } from "@/lib/social";
import { getSimilarIdeas } from "@/lib/discovery";

/**
 * "More like this" (Batch B, item 7).
 *
 * Server-rendered so the idea page needs no extra client request. Similarity is
 * computed from category, community and shared upvoters — see
 * `src/lib/discovery.ts`. Renders nothing when there is no signal.
 */
export default async function SimilarIdeas({ ideaId }: { ideaId: string }) {
  const supabase = await createClient();
  const blockedIds = await getBlockedUserIds(supabase);
  const ideas = await getSimilarIdeas(supabase, ideaId, 4, blockedIds);

  if (ideas.length === 0) return null;

  return (
    <section className="glass-panel p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
        <GitFork className="w-4 h-4" aria-hidden />
        More like this
      </h3>

      <ul className="divide-y divide-white/5">
        {ideas.map((idea) => (
          <li key={idea.id}>
            <Link
              href={`/idea/${idea.id}`}
              className="group flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="font-medium leading-snug group-hover:text-primary transition-colors">
                  {idea.title}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground/70">
                  <span>{idea.category}</span>
                  {idea.communities?.name && (
                    <span className="flex items-center gap-0.5">
                      <Hash className="w-3 h-3" aria-hidden />
                      {idea.communities.name}
                    </span>
                  )}
                  <span>
                    {idea.profiles?.username ? `@${idea.profiles.username}` : "Anonymous"}
                  </span>
                  <span className="text-muted-foreground/50">
                    {idea.reason === "community" ? "Same community" : "Similar idea"}
                  </span>
                </div>
              </div>

              <span className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden />
                {idea.upvotes_count}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
