"use client";

import { motion } from "framer-motion";
import { MessageSquare, ArrowUp, Lock, ShieldAlert, GitFork } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

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
};

interface IdeaCardProps {
  idea: Idea;
  userAge?: number | null;
  isAuthenticated: boolean;
  hasSignedNda?: boolean;
}

export default function IdeaCard({ idea, userAge, isAuthenticated, hasSignedNda }: IdeaCardProps) {
  const isAdultRestricted = idea.is_adult && (!isAuthenticated || (userAge !== null && userAge !== undefined && userAge < 18));
  const isNdaRestricted = idea.is_nda_protected && !hasSignedNda;

  const contentSnippet = idea.content.length > 150 ? idea.content.substring(0, 150) + '...' : idea.content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={(!isAdultRestricted && !isNdaRestricted) ? { y: -4, scale: 1.01 } : {}}
      className="glass-panel p-6 relative overflow-hidden group transition-all flex flex-col"
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

        <Link href={`/idea/${idea.id}`} className="block group/title">
          <h2 className="text-2xl font-bold mb-3 tracking-tight group-hover/title:text-primary transition-colors">
            {idea.title}
          </h2>
        </Link>
        
        <p className="text-muted-foreground mb-6 flex-grow">
          {contentSnippet}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors group/upvote">
              <div className="p-1.5 rounded-full bg-white/5 group-hover/upvote:bg-primary/20 transition-colors">
                <ArrowUp className="w-4 h-4" />
              </div>
              <span className="font-semibold">{idea.upvotes_count}</span>
            </button>
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
          <Link href={`/create?parentId=${idea.id}`} className="text-xs font-medium text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
            <GitFork className="w-3 h-3" /> Fork
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
