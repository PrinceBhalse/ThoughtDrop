"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Hash, TrendingUp, ArrowUp, Loader2 } from "lucide-react";

interface Idea {
  id: string;
  title: string;
  category: string;
  status: string;
}

interface Community {
  id: string;
  name: string;
}

export default function SearchMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside.
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Debounced search.
  useEffect(() => {
    if (!query.trim()) {
      const id = setTimeout(() => {
        setIdeas([]);
        setCommunities([]);
        setLoading(false);
      }, 0);
      return () => clearTimeout(id);
    }
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=6`);
        const data = await res.json();
        setIdeas(data.ideas ?? []);
        setCommunities(data.communities ?? []);
      } catch {
        setIdeas([]);
        setCommunities([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  const hasResults = ideas.length > 0 || communities.length > 0;

  return (
    <div ref={boxRef} className="relative">
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          placeholder="Search ideas, topics, or creators..."
          className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
        />
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl border border-border bg-surface shadow-2xl overflow-hidden">
          {query.trim() === "" ? (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">
              Type to search ideas &amp; communities
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-6 text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Searching…
            </div>
          ) : !hasResults ? (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {communities.map((c) => (
                <Link
                  key={`c-${c.id}`}
                  href={`/d/${c.name}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.06] transition-colors"
                >
                  <span className="p-1.5 rounded-md bg-white/5"><Hash className="w-3.5 h-3.5 text-primary" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">/d/{c.name}</p>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Community
                  </span>
                </Link>
              ))}
              {ideas.map((idea) => (
                <Link
                  key={`i-${idea.id}`}
                  href={`/idea/${idea.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.06] transition-colors"
                >
                  <span className="p-1.5 rounded-md bg-white/5"><ArrowUp className="w-3.5 h-3.5 text-primary" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{idea.title}</p>
                    <p className="text-xs text-muted-foreground">{idea.category} · {idea.status}</p>
                  </div>
                </Link>
              ))}
              <button
                onClick={() => {
                  setOpen(false);
                  router.push(`/`);
                }}
                className="w-full px-4 py-2.5 text-left text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors border-t border-border"
              >
                Press Enter for full search →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
