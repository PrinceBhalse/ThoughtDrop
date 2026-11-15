"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, X } from "lucide-react";
import FollowButton from "./FollowButton";
import type { SuggestedPerson } from "@/lib/discovery";

const DISMISS_KEY = "td_people_dismissed";

/** sessionStorage is unavailable during SSR and in some private modes. */
function readDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * "People you may know" module (Batch B, item 8).
 *
 * Renders nothing for signed-out readers, when the graph has no signal yet, or
 * when the reader dismisses it for the session. No auto-follow — each card
 * carries a normal follow button.
 */
export default function PeopleYouMayKnow({ enabled }: { enabled: boolean }) {
  const [people, setPeople] = useState<SuggestedPerson[]>([]);
  const [dismissed, setDismissed] = useState(readDismissed);

  useEffect(() => {
    if (!enabled || dismissed) return;
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/people/suggest?limit=4");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setPeople(Array.isArray(data.people) ? data.people : []);
      } catch {
        // Discovery is additive; a failure must not affect the feed.
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [enabled, dismissed]);

  if (!enabled || dismissed || people.length === 0) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Ignore: the module still hides for this page view.
    }
  };

  return (
    <section className="border border-white/10 rounded-2xl p-5 bg-white/[0.02]">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" aria-hidden />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            People you may know
          </h2>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss people suggestions"
          title="Not now"
          className="p-1.5 -mt-1 -mr-1 rounded-full text-muted-foreground/60 hover:bg-white/10 hover:text-foreground transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {people.map((person) => (
          <li
            key={person.id}
            className="flex flex-col gap-3 p-4 rounded-xl border border-white/5 bg-black/20"
          >
            <div className="min-w-0">
              <Link
                href={`/profile/${person.username}`}
                className="font-semibold truncate block hover:text-primary transition-colors"
              >
                @{person.username}
              </Link>
              <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-1">
                {person.reason}
              </p>
              {person.bio && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {person.bio}
                </p>
              )}
            </div>
            <div className="mt-auto">
              <FollowButton
                targetId={person.id}
                initialFollowing={false}
                initialFollowers={0}
                showCount={false}
                surface="home"
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
