"use client";

/**
 * Client-side feed signal tracker (migration 0015).
 *
 * Events are queued in memory, flushed in batches to /api/events, and only
 * ever contain the signed-in user's own activity. No third-party analytics.
 */

export type FeedEventType =
  | "impression"
  | "click"
  | "dwell"
  | "like"
  | "unlike"
  | "save"
  | "unsave"
  | "share"
  | "skip"
  | "show_less"
  | "follow"
  | "unfollow"
  | "search";

export type FeedSurface = "home" | "search" | "profile" | "community" | "idea" | "other";

export interface TrackEventInput {
  ideaId?: string | null;
  eventType: FeedEventType;
  surface?: FeedSurface;
  dwellMs?: number;
  metadata?: Record<string, unknown>;
}

interface QueuedEvent extends TrackEventInput {
  sessionId: string;
}

const queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let cachedSessionId: string | null = null;

const SESSION_KEY = "td_session_id";

export function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  if (cachedSessionId) return cachedSessionId;
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) {
      cachedSessionId = existing;
      return existing;
    }
    const fresh =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY, fresh);
    cachedSessionId = fresh;
    return fresh;
  } catch {
    cachedSessionId = `s_${Date.now()}`;
    return cachedSessionId;
  }
}

export function trackEvent(input: TrackEventInput): void {
  if (typeof window === "undefined") return;
  queue.push({ ...input, sessionId: getSessionId() });
  if (queue.length >= 20) {
    void flushEvents();
  } else if (!flushTimer) {
    flushTimer = setTimeout(() => {
      void flushEvents();
    }, 4000);
  }
}

export async function flushEvents(): Promise<void> {
  if (typeof window === "undefined") return;
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (queue.length === 0) return;

  const batch = queue.splice(0, 40);
  try {
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: batch }),
      keepalive: true,
    });
  } catch {
    // Signals are best-effort; never block the UI on telemetry.
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    void flushEvents();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void flushEvents();
  });
}
