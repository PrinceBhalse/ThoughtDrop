"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

interface Idea {
  id: string;
  title: string;
  category: string;
  status: string;
  username?: string;
}

interface Community {
  id: string;
  name: string;
}

function SearchPlaceholder() {
  return (
    <div className="min-h-screen bg-background py-12 text-center">
      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> Loading…
    </div>
  );
}

function SearchContent() {
  const [query, setQuery] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<Array<{ id: string; title: string; category: string; status: string; username?: string }>>([]);
  const [communities, setCommunities] = useState<Array<{ id: string; name: string }>>([]);
  const [surprise, setSurprise] = useState(false);
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") || "";

  useEffect(() => {
    if (currentQuery && currentQuery.trim()) {
      setQuery(currentQuery.trim());
    }
  }, [currentQuery]);

  const loadResults = async (q: string) => {
    if (!q.trim()) {
      setIdeas([]);
      setCommunities([]);
      return;
    }
    setIdeas([]);
    setCommunities([]);
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=12`);
      const data = await res.json();
      setIdeas(data.ideas ?? []);
      setCommunities(data.communities ?? []);
      setSurprise(true);
    } catch {
      setIdeas([]);
      setCommunities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentQuery?.trim()) {
      loadResults("");
    }
  }, [currentQuery]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-primary">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <h1 className="text-xl font-semibold">Discover</h1>
          </div>
          {surprise ? (
            <button onClick={() => setSurprise(false)} className="text-sm text-muted-foreground hover underline">
              Close
            </button>
          ) : (
            <button onClick={() => setSurprise(true)} className="text-sm text-muted-foreground hover underline">
              Surprise me&rarr;
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        <section className="mb-6 rounded-xl border border-border p-4 glass-panel">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSurprise(false)}
              placeholder="Search ideas, topics, or creators..."
              className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
              autoFocus
            />
            <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
        </section>

        <section>
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> Loading…
            </div>
          ) : !query.trim() ? (
            <div className="py-12 text-center text-muted-foreground">
              Type above to search ideas & communities
            </div>
          ) : ideas.length === 0 && communities.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="grid gap-4">
              {ideas.length > 0 && (
                <div>
                  <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Related Ideas</h2>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {ideas.map((idea) => (
                      <Link
                        key={idea.id}
                        href={`/idea/${idea.id}`}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-md hover:bg-white/[0.05] transition-colors"
                      >
                        <span className="p-1.5 rounded-md bg-white/5">
                          {idea.category === "Tech" && <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-primary"><path d="M13 10V3L4 14h7v7l9-11" /></svg>}
                          {idea.category === "Creative" && <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-primary"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>}
                          {idea.category === "Social Impact" && <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-primary"><path d="M21 21V5a2 2 0 00-2-2H5a2 2 0 00-2 2v16l5-5z" /></svg>}
                          {idea.category !== "Tech" && idea.category !== "Creative" && idea.category !== "Social Impact" && <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-primary"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{idea.title}</p>
                          {idea.username && <p className="text-xs text-muted-foreground">by @{idea.username}</p>}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {communities.length > 0 && (
                <div>
                  <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Communities</h2>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {communities.map((c) => (
                      <Link
                        key={`c-${c.id}`}
                        href={`/d/${c.name}`}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-md hover:bg-white/[0.05] transition-colors"
                      >
                        <span className="p-1.5 rounded-md bg-white/5">
                          <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-primary"><circle cx="12" cy="12" r="10" /><path d="M12 2v20M20 12H4" /></svg>
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{c.name}</p>
                          <p className="text-xs text-muted-foreground">Community</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {surprise && (
                <div className="mt-6 glass-panel p-5 rounded-xl border border-border">
                  <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Surprise me
                    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline-block align-middle">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </h2>
                  <p className="text-xs text-muted-foreground mb-3">
                    Controlled serendipity -- content from adjacent interest clusters and rising creators
                  </p>
                  <p className="text-xs text-muted-foreground">
                    We mix what you're searching for with fresh perspectives from adjacent communities and rising creators.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function SearchDiscoveryPage() {
  return (
    <Suspense fallback={<SearchPlaceholder />}>
      <SearchContent />
    </Suspense>
  );
}