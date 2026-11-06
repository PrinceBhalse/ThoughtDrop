"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Flag } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/Toast";

/**
 * Block + report controls on public profiles — required in-app moderation
 * tools under Google Play's User Generated Content policy.
 */
export default function UserSafetyButtons({ targetId }: { targetId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState<"idle" | "confirming" | "done">("idle");
  const [blocked, setBlocked] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const supabase = createClient();
    supabase
      .from("user_blocks")
      .select("blocked_id")
      .eq("blocked_id", targetId)
      .maybeSingle()
      .then(({ data }) => {
        if (mounted.current) setBlocked(!!data);
      });
    return () => {
      mounted.current = false;
    };
  }, [targetId]);

  const toggleBlock = async () => {
    if (pending) return;
    setPending(true);

    try {
      const res = await fetch("/api/user/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: targetId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not update block");

      setBlocked(!!data.blocked);
      toast(data.blocked ? "User blocked" : "User unblocked", "success");
      // Re-renders remove this user's ideas/comments from every list.
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Something went wrong", "error");
    } finally {
      setPending(false);
    }
  };

  const reportUser = async () => {
    if (pending) return;
    setPending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("user_reports").insert({
        reporter_id: (await supabase.auth.getUser()).data.user?.id,
        reported_id: targetId,
      });
      if (error) throw error;
      setStatus("done");
      toast("Thanks — we'll review this account", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not report", "error");
      setStatus("idle");
    } finally {
      setPending(false);
    }
  };

  if (blocked) {
    return (
      <button
        onClick={toggleBlock}
        disabled={pending}
        className="shrink-0 px-4 py-2 rounded-lg font-medium text-sm bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 disabled:opacity-60"
      >
        {pending ? "Working…" : "Unblock"}
      </button>
    );
  }

  if (status === "done") {
    return <span className="text-xs text-muted-foreground">Reported for review.</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleBlock}
        disabled={pending}
        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground border border-white/10 bg-white/5 hover:text-red-400 hover:border-red-500/30 disabled:opacity-60"
      >
        <Ban className="w-3.5 h-3.5" />
        Block
      </button>

      {status === "confirming" ? (
        <span className="flex items-center gap-2 text-xs">
          <button
            onClick={reportUser}
            disabled={pending}
            className="text-red-400 font-medium hover:text-red-300"
          >
            Confirm report
          </button>
          <button onClick={() => setStatus("idle")} className="text-muted-foreground hover:text-foreground">
            Cancel
          </button>
        </span>
      ) : (
        <button
          onClick={() => setStatus("confirming")}
          disabled={pending}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground border border-white/10 bg-white/5 hover:text-red-400 hover:border-red-500/30 disabled:opacity-60"
          aria-label="Report this user"
        >
          <Flag className="w-3.5 h-3.5" />
          Report
        </button>
      )}
    </div>
  );
}
