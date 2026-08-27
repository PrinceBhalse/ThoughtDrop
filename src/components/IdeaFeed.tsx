"use client";

import { useEffect, useRef, useState } from "react";
import IdeaCard, { type Idea } from "./IdeaCard";
import { Loader2 } from "lucide-react";

const PAGE_SIZE = 15;

export default function IdeaFeed({
  initialIdeas,
  userAge,
  isAuthenticated,
}: {
  initialIdeas: Idea[];
  userAge: number | null;
  isAuthenticated: boolean;
}) {
  const [ideas, setIdeas] = useState<Idea[]>(initialIdeas);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const lastCreatedAt = ideas.length > 0 ? ideas[ideas.length - 1].created_at : null;

  useEffect(() => {
    setIdeas(initialIdeas);
    setDone(false);
  }, [initialIdeas]);

  const loadMore = async () => {
    if (loading || done || !lastCreatedAt) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/feed?before=${encodeURIComponent(lastCreatedAt)}&limit=${PAGE_SIZE}`);
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
  }, [lastCreatedAt, loading, done]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ideas.map((idea: Idea) => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            userAge={userAge}
            isAuthenticated={isAuthenticated}
          />
        ))}
      </div>

      <div ref={sentinelRef} className="py-10 flex items-center justify-center">
        {loading && (
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        )}
        {done && ideas.length > 0 && (
          <p className="text-sm text-muted-foreground">You&rsquo;re all caught up.</p>
        )}
      </div>
    </>
  );
}
