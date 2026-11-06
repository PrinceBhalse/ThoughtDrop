"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

interface FollowButtonProps {
  targetId: string;
  initialFollowing: boolean;
  initialFollowers: number;
}

export default function FollowButton({
  targetId,
  initialFollowing,
  initialFollowers,
}: FollowButtonProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [followers, setFollowers] = useState(initialFollowers);
  const [pending, setPending] = useState(false);

  const toggle = async () => {
    if (pending) return;
    setPending(true);

    const previous = following;
    const previousCount = followers;

    // Optimistic update, rolled back if the request fails.
    setFollowing(!previous);
    setFollowers(Math.max(0, previousCount + (previous ? -1 : 1)));

    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: targetId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not update follow");
      }

      const data = await res.json();
      setFollowing(data.following);
      if (typeof data.followersCount === "number") {
        setFollowers(data.followersCount);
      }

      router.refresh();
    } catch (error) {
      setFollowing(previous);
      setFollowers(previousCount);
      toast(error instanceof Error ? error.message : "Could not update follow", "error");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggle}
        disabled={pending}
        className={`shrink-0 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-60 ${
          following
            ? "bg-white/5 text-muted-foreground hover:bg-red-500/20 hover:text-red-400 border border-white/10"
            : "primary-button"
        }`}
      >
        {following ? "Following" : "Follow"}
      </button>
      <span className="text-sm text-muted-foreground">{followers} followers</span>
    </div>
  );
}
