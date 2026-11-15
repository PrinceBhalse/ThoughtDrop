"use client";

import { useEffect, useRef, useState } from "react";
import IdeaCard, { type Idea } from "./IdeaCard";
import { Loader2 } from "lucide-react";
import type { FeedSurface } from "@/lib/events";

const PAGE_SIZE = 15;

export default function IdeaFeed({
  initialIdeas,
  userAge,
  isAuthenticated,
  category = "All",
  sort = "foryou",
  intent = null,
  surface = "home",
}: {
  initialIdeas: Idea[];
  userAge: number | null;
  isAuthenticated: boolean;
  category?: string;
  sort?: string;
  intent?: string | null;
  surface?: FeedSurface;
}) {
  const [ideas, setIdeas] = useState<Idea[]>(initialIdeas);
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const lastCreatedAt = ideas.length > 0 ? ideas[ideas.length - 1].created_at : null;

  const loadMore = async () => {
    if (loading || done || !lastCreatedAt) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        before: lastCreatedAt,
        limit: PAGE_SIZE.toString(),
        category,
        sort,
      });
      if (intent) params.set("intent", intent);
      const res = await fetch(`/api/feed?${params.toString()}`);
      const data = await res.json();
      const next = data.ideas ?? [];
      if (next.length === 0) {
        setDone(true);
      } else {
        setIdeas((prev) => [...prev, ...next]);
      }
    } catch {
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastCreatedAt, loading, done, category, sort, intent]);

  // "Show me less" hides the card immediately; the signal is queued by IdeaCard
  // and suppresses that idea (and, after repeats, its author) server-side.
  const handleShowLess = (idea: Idea) => {
    setHidden((prev) => {
      const next = new Set(prev);
      next.add(idea.id);
      return next;
    });
  };

  const visible = ideas.filter((idea) => !hidden.has(idea.id));

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visible.map((idea: Idea) => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            userAge={userAge}
            isAuthenticated={isAuthenticated}
            surface={surface}
            onShowLess={handleShowLess}
          />
        ))}
      </div>

      <div ref={sentinelRef} className="py-10 flex items-center justify-center">
        {loading && (
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        )}
        {done && visible.length > 0 && (
          <p className="text-sm text-muted-foreground">You&rsquo;re all caught up.</p>
        )}
      </div>
    </>
  );
}
