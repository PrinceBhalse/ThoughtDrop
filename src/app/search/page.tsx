"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Search, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

interface Idea {
  id: string;
  title: string;
  category: string;
  status: string;
  username?: string;
  reason?: string;
}

interface Community {
  id: string;
  name: string;
}

function SearchPlaceholder() {
  return (
    <div className="min-h-screen bg-background py-12 text-center">
      <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" /> Loading…
    </div>
  );
}

function IdeaRow({ idea }: { idea: Idea }) {
  return (
    <Link
      href={`/idea/${idea.id}`}
      className="flex items-center gap-3 rounded-md px-4 py-2.5 transition-colors hover:bg-white/[0.05]"
    >
      <span className="rounded-md bg-white/5 p-1.5">
        <Search className="h-3.5 w-3.5 text-primary" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{idea.title}</p>
        <p className="text-xs text-muted-foreground">
          {idea.category}
          {idea.username ? ` · @${idea.username}` : ""}
        </p>
      </div>
    </Link>
  );
}

function SearchContent({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [surprise, setSurprise] = useState(false);
  const [surpriseIdeas, setSurpriseIdeas] = useState<Idea[]>([]);

  const trimmed = query.trim();

  // Debounced search; all state updates happen inside the timer callback.
  useEffect(() => {
    if (!trimmed) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&limit=12`);
        const data = await res.json();
        if (cancelled) return;
        setIdeas(data.ideas ?? []);
        setCommunities(data.communities ?? []);
        setSearched(true);
      } catch {
        if (!cancelled) {
          setIdeas([]);
          setCommunities([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed]);

  // "Surprise me" pulls the exploration slice of the For You feed.
  useEffect(() => {
    if (!surprise) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/feed?sort=foryou&limit=24");
        const data = await res.json();
        if (cancelled) return;
        const list = (data.ideas ?? []) as Idea[];
        const outside = list.filter((idea) => idea.reason === "surprise");
        setSurpriseIdeas(outside.length > 0 ? outside : list.slice(0, 9));
      } catch {
        if (!cancelled) setSurpriseIdeas([]);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [surprise]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">Discover</h1>
          </div>
          <button
            onClick={() => setSurprise((value) => !value)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:underline"
            aria-pressed={surprise}
          >
            <Sparkles className="h-4 w-4" />
            {surprise ? "Hide surprises" : "Surprise me"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4">
        <section className="glass-panel mb-6 rounded-xl border border-border p-4">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ideas, topics, or creators…"
              className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </section>

        {surprise && (
          <section className="glass-panel mb-6 rounded-xl border border-border p-5">
            <h2 className="mb-1 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" /> Outside your usual
            </h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Controlled serendipity — ideas from adjacent interest clusters and rising creators,
              not just more of what you already read.
            </p>
            {surpriseIdeas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing surprising yet — check back soon.</p>
            ) : (
              <div className="space-y-1">
                {surpriseIdeas.map((idea) => (
                  <IdeaRow key={`s-${idea.id}`} idea={idea} />
                ))}
              </div>
            )}
          </section>
        )}

        <section>
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" /> Loading…
            </div>
          ) : !trimmed ? (
            <div className="py-12 text-center text-muted-foreground">
              Type above to search ideas &amp; communities
            </div>
          ) : ideas.length === 0 && communities.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {searched ? <>No results for &ldquo;{trimmed}&rdquo;</> : "Searching…"}
            </div>
          ) : (
            <div className="grid gap-6">
              {ideas.length > 0 && (
                <div>
                  <h2 className="mb-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                    Related Ideas
                  </h2>
                  <div className="space-y-1">
                    {ideas.map((idea) => (
                      <IdeaRow key={idea.id} idea={idea} />
                    ))}
                  </div>
                </div>
              )}

              {communities.length > 0 && (
                <div>
                  <h2 className="mb-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                    Communities
                  </h2>
                  <div className="space-y-1">
                    {communities.map((community) => (
                      <Link
                        key={`c-${community.id}`}
                        href={`/d/${community.name}`}
                        className="flex items-center gap-3 rounded-md px-4 py-2.5 transition-colors hover:bg-white/[0.05]"
                      >
                        <span className="rounded-md bg-white/5 p-1.5">
                          <Search className="h-3.5 w-3.5 text-primary" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{community.name}</p>
                          <p className="text-xs text-muted-foreground">Community</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

/** `useSearchParams` needs a Suspense boundary during prerender (Next 16). */
function SearchRoute() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  // Remount on navigation so the input follows `?q=`.
  return <SearchContent key={query} initialQuery={query} />;
}

export default function SearchDiscoveryPage() {
  return (
    <Suspense fallback={<SearchPlaceholder />}>
      <SearchRoute />
    </Suspense>
  );
}
