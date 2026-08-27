import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  line: React.ReactNode;
  code: string;
  ctaLabel: string;
  ctaHref: string;
  hint?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  line,
  code,
  ctaLabel,
  ctaHref,
  hint,
}: EmptyStateProps) {
  return (
    <div className="glass-panel flex flex-col items-center justify-center text-center py-20 px-6 gap-5">
      <div className="w-14 h-14 rounded-xl bg-white/[0.04] border border-border flex items-center justify-center">
        <Icon className="w-7 h-7 text-muted-foreground" />
      </div>
      <div className="space-y-1.5 max-w-md">
        <h3 className="text-2xl font-semibold tracking-tight">{title}</h3>
        <p className="text-muted-foreground">{line}</p>
      </div>
      <div className="rounded-lg bg-white/[0.04] border border-border px-4 py-2 font-mono text-sm text-foreground-soft">
        <span className="text-primary">{code}</span>
      </div>
      <Link href={ctaHref} className="primary-button">
        {ctaLabel}
      </Link>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
