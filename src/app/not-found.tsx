import Link from "next/link";
import { Bug } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 gap-6 max-w-lg mx-auto">
      <div className="w-14 h-14 rounded-xl bg-white/[0.04] border border-border flex items-center justify-center">
        <Bug className="w-7 h-7 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">404 — Thought not found</h1>
        <p className="text-muted-foreground text-lg">
          This idea either never existed, was removed, or you followed a stale link.
          The ripple for this thought never made it ashore.
        </p>
      </div>
      <div className="rounded-lg bg-white/[0.04] border border-border px-4 py-2 font-mono text-sm text-foreground-soft">
        <span className="text-primary">raise</span>: #404: missing_thought
      </div>
      <Link href="/" className="primary-button">
        Return to the feed
      </Link>
      <p className="text-xs text-muted-foreground">
        Tip: if you&apos;re hunting for a specific idea, head back to the feed and use search.
      </p>
    </div>
  );
}
