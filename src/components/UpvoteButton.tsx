"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleUpvote } from "@/app/actions/upvote";

export default function UpvoteButton({
  ideaId,
  initialCount,
  className,
}: {
  ideaId: string;
  initialCount: number;
  className?: string;
}) {
  const router = useRouter();
  const [count, setCount] = useState(initialCount);
  const [upvoted, setUpvoted] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    // Optimistic update
    const willUpvote = !upvoted;
    setUpvoted(willUpvote);
    setCount((c) => Math.max(0, c + (willUpvote ? 1 : -1)));

    startTransition(async () => {
      const result = await toggleUpvote(ideaId, count);
      if (!result.ok) {
        // Roll back
        setCount((c) => Math.max(0, c + (upvoted ? 1 : -1)));
        setUpvoted(upvoted);
        if (result.requiresAuth) {
          router.push("/login");
        }
        return;
      }
      // Reconcile with authoritative state returned by the RPC.
      const serverUpvoted = result.upvoted;
      setCount((c) => (serverUpvoted ? Math.max(initialCount, c) : Math.min(initialCount, c)));
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={cn(
        "group inline-flex items-center gap-1.5 text-muted-foreground transition-colors disabled:opacity-60",
        upvoted && "text-primary",
        className
      )}
      aria-pressed={upvoted}
    >
      <span className="p-1.5 rounded-full bg-white/5 group-hover:bg-primary/20 transition-colors">
        <ArrowUp className={cn("w-4 h-4", upvoted && "text-primary")} />
      </span>
      <span className="font-semibold">{count}</span>
    </button>
  );
}
