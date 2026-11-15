"use client";

import { useState } from "react";
import { Brain, Coffee, GraduationCap, Users, X } from "lucide-react";
import { getSessionId, trackEvent } from "@/lib/events";

const INTENT_KEY = "td_intent";

const OPTIONS = [
  {
    id: "distract",
    label: "Distract me",
    description: "Light, fun and unexpected",
    icon: Coffee,
  },
  {
    id: "inspire",
    label: "Inspire me",
    description: "Bold ideas worth building",
    icon: Brain,
  },
  {
    id: "catchup",
    label: "Catch up",
    description: "What people you follow shared",
    icon: Users,
  },
  {
    id: "learn",
    label: "Learn something",
    description: "Deep dives and practical thinking",
    icon: GraduationCap,
  },
] as const;

export type SessionIntent = (typeof OPTIONS)[number]["id"];

function readIntentValue(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(INTENT_KEY);
  } catch {
    return null;
  }
}

export function readStoredIntent(): SessionIntent | null {
  const value = readIntentValue();
  return value === "distract" || value === "inspire" || value === "catchup" || value === "learn"
    ? value
    : null;
}

/** True once the reader has picked a mood or explicitly skipped this session. */
export function hasAnsweredIntent(): boolean {
  return readIntentValue() !== null;
}

/**
 * One-question prompt shown once per session. The answer is the strongest
 * cold-start signal for the For You feed; skipping is always allowed.
 */
export default function SessionIntentPrompt({ enabled }: { enabled: boolean }) {
  const [dismissed, setDismissed] = useState(false);
  const [picked, setPicked] = useState<SessionIntent | null>(null);

  // Reading sessionStorage during render is cheap and side-effect free; the
  // prompt stays closed on the server and once the reader has answered.
  const open = enabled && !dismissed && !hasAnsweredIntent();

  const choose = (intent: SessionIntent) => {
    try {
      sessionStorage.setItem(INTENT_KEY, intent);
    } catch {
      // private mode — the feed simply stays unpersonalized
    }
    setPicked(intent);
    setDismissed(true);
    trackEvent({ eventType: "click", surface: "home", metadata: { intent } });
    void fetch("/api/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: getSessionId(), intent }),
    }).catch(() => {});
    window.dispatchEvent(new CustomEvent("td:intent", { detail: intent }));
  };

  const skip = () => {
    try {
      sessionStorage.setItem(INTENT_KEY, "skip");
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="glass-panel relative w-full max-w-lg p-6">
        <button
          onClick={skip}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
          aria-label="Skip"
        >
          <X className="h-4 w-4" />
        </button>
        <h2 className="text-xl font-semibold tracking-tight">What brings you here?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a mood — your feed adapts for this session.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => choose(option.id)}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/10"
              >
                <span className="rounded-lg bg-white/5 p-2">
                  <Icon className="h-4 w-4 text-primary" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{option.label}</span>
                  <span className="block text-xs text-muted-foreground">{option.description}</span>
                </span>
              </button>
            );
          })}
        </div>
        <button
          onClick={skip}
          className="mt-4 text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          Skip for now
        </button>
        {picked && <span className="sr-only">{picked}</span>}
      </div>
    </div>
  );
}
