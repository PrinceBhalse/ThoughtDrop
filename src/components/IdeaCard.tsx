"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Lock,
  ShieldAlert,
  GitFork,
  Users,
  TrendingUp,
  Clock,
  Sparkles,
  EyeOff,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import UpvoteButton from "./UpvoteButton";
import BookmarkButton from "./BookmarkButton";
import { trackEvent, type FeedSurface } from "@/lib/events";

export type Idea = {
  id: string;
  title: string;
  content: string;
  content_html?: string;
  category: string;
  status: string;
  is_adult: boolean;
  is_nda_protected?: boolean;
  parent_idea_id?: string;
  upvotes_count: number;
  created_at: string;
  is_anonymous: boolean;
  user_id?: string;
  required_roles?: string[];
  communities?: { name: string } | null;
  profiles?: {
    username: string;
  };
  /** Why this idea was ranked into the feed (added by /api/feed). */
  reason?: string;
};

interface IdeaCardProps {
  idea: Idea;
  userAge?: number | null;
  isAuthenticated: boolean;
  hasSignedNda?: boolean;
  /** Where this card is rendered; used for feed signal attribution. */
  surface?: FeedSurface;
  /** Called when the reader taps "show me less". */
  onShowLess?: (idea: Idea) => void;
}

const REASON_META: Record<
  string,
  { label: string; icon: typeof Users }
> = {
  following: { label: "Because you follow them", icon: Users },
  trending: { label: "Trending now", icon: TrendingUp },
  top: { label: "Top voted", icon: Award },
  new: { label: "Just posted", icon: Clock },
  surprise: { label: "Outside your usual", icon: Sparkles },
};

export default function IdeaCard({
  idea,
  userAge,
  isAuthenticated,
  hasSignedNda,
  surface = "home",
  onShowLess,
}: IdeaCardProps) {
  const isAdultRestricted = idea.is_adult && (!isAuthenticated || (userAge !== null && userAge !== undefined && userAge < 18));
  const isNdaRestricted = idea.is_nda_protected && !hasSignedNda;

  const contentSnippet = idea.content.length > 150 ? idea.content.substring(0, 150) + '...' : idea.content;

  const canInteract = !isAdultRestricted && !isNdaRestricted;

  // ---------------------------------------------------------------
  // Impression + dwell signals (Batch A). One impression per mount when
  // at least half the card is on screen; dwell is accumulated while
  // visible and flushed when the card leaves the viewport or unmounts.
  // ---------------------------------------------------------------
  const cardRef = useRef<HTMLDivElement | null>(null);
  const visibleSince = useRef<number | null>(null);
  const dwellAccum = useRef(0);
  const impressionSent = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    const el = cardRef.current;
    if (!el) return;

    const flushDwell = () => {
      if (dwellAccum.current >= 400) {
        trackEvent({
          ideaId: idea.id,
          eventType: "dwell",
          surface,
          dwellMs: Math.min(dwellAccum.current, 600_000),
          metadata: { reason: idea.reason ?? null },
        });
      }
      dwellAccum.current = 0;
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            if (visibleSince.current === null) visibleSince.current = Date.now();
            if (!impressionSent.current) {
              impressionSent.current = true;
              trackEvent({
                ideaId: idea.id,
                eventType: "impression",
                surface,
                metadata: {
                  reason: idea.reason ?? null,
                  authorId: idea.user_id ?? null,
                },
              });
            }
          } else if (visibleSince.current !== null) {
            dwellAccum.current += Date.now() - visibleSince.current;
            visibleSince.current = null;
          }
        }
      },
      { threshold: [0, 0.5, 1] }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (visibleSince.current !== null) {
        dwellAccum.current += Date.now() - visibleSince.current;
        visibleSince.current = null;
      }
      flushDwell();
    };
  }, [idea.id, idea.reason, idea.user_id, isAuthenticated, surface]);

  const handleShowLess = () => {
    trackEvent({
      ideaId: idea.id,
      eventType: "show_less",
      surface,
      metadata: {
        reason: idea.reason ?? null,
        authorId: idea.user_id ?? null,
        category: idea.category,
      },
    });
    onShowLess?.(idea);
  };

  const reasonMeta = idea.reason ? REASON_META[idea.reason] : undefined;
  const ReasonIcon = reasonMeta?.icon;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={canInteract ? { y: -6 } : {}}
      whileTap={canInteract ? { y: -2 } : {}}
      className="glass-panel p-6 relative overflow-hidden group transition-colors flex flex-col"
    >
      {/* Category Gradient Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent opacity-50 group-hover:opacity-100 transition-opacity" />

      {/* Adult Restriction Overlay */}
      {isAdultRestricted && (
        <div className="absolute inset-0 z-20 backdrop-blur-2xl bg-secondary/90 flex flex-col items-center justify-center p-6 text-center border border-white/5 rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold mb-2">18+ Content</h3>
          <p className="text-muted-foreground text-sm max-w-sm mb-4">
            This idea has been flagged as adult content. You must be logged in and over 18 to view it.
          </p>
          {!isAuthenticated && (
            <Link href="/login" className="glass-button text-sm">Log in to Verify</Link>
          )}
        </div>
      )}

      {/* NDA Restriction Overlay */}
      {!isAdultRestricted && isNdaRestricted && (
        <div className="absolute inset-0 z-10 backdrop-blur-xl bg-secondary/80 flex flex-col items-center justify-center p-6 text-center border border-white/5 rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold mb-2">NDA Protected</h3>
          <p className="text-muted-foreground text-sm max-w-xs mb-4">
            The creator requires you to sign a digital Non-Disclosure Agreement before viewing the full mechanics.
          </p>
          <Link href={`/idea/${idea.id}`} className="primary-button text-sm">
            Review & Sign NDA
          </Link>
        </div>
      )}

      <div className={cn("flex flex-col h-full", (isAdultRestricted || isNdaRestricted) && "opacity-20 select-none")}>
        <div className="flex justify-between items-start mb-4 gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/20">
              {idea.category}
            </span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/5 text-muted-foreground border border-white/10">
              {idea.status}
            </span>
            {idea.parent_idea_id && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/20 flex items-center gap-1">
                <GitFork className="w-3 h-3" /> Forked
              </span>
            )}
            {idea.communities && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/20">
                /d/{idea.communities.name}
              </span>
            )}
            {idea.required_roles && idea.required_roles.map((role, i) => (
              <span key={i} className="text-xs font-medium px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/20">
                Need {role}
              </span>
            ))}
          </div>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {idea.is_anonymous || !idea.profiles ? "🕵️ Anonymous" : `@${idea.profiles.username}`}
          </span>
        </div>

        <Link
          href={`/idea/${idea.id}`}
          className="block group/title"
          onClick={() =>
            trackEvent({
              ideaId: idea.id,
              eventType: "click",
              surface,
              metadata: { reason: idea.reason ?? null },
            })
          }
        >
          <h2 className="text-2xl font-bold mb-3 tracking-tight group-hover/title:text-primary transition-colors">
            {idea.title}
          </h2>
        </Link>
        
        <p className="text-muted-foreground mb-6 flex-grow">
          {contentSnippet}
        </p>

        {isAuthenticated && reasonMeta && ReasonIcon && (
          <div className="mb-3 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground/70">
            <ReasonIcon className="w-3 h-3" aria-hidden />
            <span>{reasonMeta.label}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
          <div className="flex items-center gap-4">
            <UpvoteButton ideaId={idea.id} initialCount={idea.upvotes_count} surface={surface} />
            <BookmarkButton ideaId={idea.id} surface={surface} />
            <Link href={`/idea/${idea.id}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-white transition-colors">
              <div className="p-1.5 rounded-full bg-white/5">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="font-medium text-sm">Discuss</span>
            </Link>
            {idea.status === 'In Progress' && (
              <Link href={`/idea/${idea.id}/workspace`} className="flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors">
                <span className="font-medium text-sm">Join Workspace</span>
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/create?parentId=${idea.id}`} className="text-xs font-medium text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
              <GitFork className="w-3 h-3" /> Fork
            </Link>
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleShowLess}
                title="Show me less like this"
                aria-label="Show me less like this"
                className="p-1.5 rounded-full text-muted-foreground/60 transition-colors hover:bg-white/10 hover:text-foreground"
              >
                <EyeOff className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
