-- Migration 0015: Feed signals, session intent, and personalization consent.
--
-- Why: every ranking/feed feature planned for v1.1+ needs behavioural signals.
-- This table is the single place explicit + implicit events are stored. It is
-- user-scoped, RLS-protected, and deleted with the account (see
-- /api/account/delete). No third-party analytics, no cross-app tracking.

-- 1. Raw feed events -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feed_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_id uuid REFERENCES public.ideas(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN (
    'impression', 'click', 'dwell', 'like', 'unlike', 'save', 'unsave',
    'share', 'skip', 'show_less', 'follow', 'unfollow', 'search'
  )),
  surface text NOT NULL DEFAULT 'home' CHECK (surface IN (
    'home', 'search', 'profile', 'community', 'idea', 'other'
  )),
  session_id text,
  dwell_ms integer CHECK (dwell_ms IS NULL OR (dwell_ms >= 0 AND dwell_ms <= 86400000)),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS feed_events_user_created_idx
  ON public.feed_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS feed_events_idea_idx
  ON public.feed_events(idea_id);
CREATE INDEX IF NOT EXISTS feed_events_type_created_idx
  ON public.feed_events(event_type, created_at DESC);

ALTER TABLE public.feed_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own feed events" ON public.feed_events;
CREATE POLICY "Users can insert own feed events" ON public.feed_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own feed events" ON public.feed_events;
CREATE POLICY "Users can read own feed events" ON public.feed_events
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own feed events" ON public.feed_events;
CREATE POLICY "Users can delete own feed events" ON public.feed_events
  FOR DELETE USING (auth.uid() = user_id);

-- 2. Session intent (cold-start signal) ------------------------------------
CREATE TABLE IF NOT EXISTS public.session_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  intent text NOT NULL CHECK (intent IN ('distract', 'inspire', 'catchup', 'learn')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS session_intents_user_created_idx
  ON public.session_intents(user_id, created_at DESC);

ALTER TABLE public.session_intents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own session intents" ON public.session_intents;
CREATE POLICY "Users can insert own session intents" ON public.session_intents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own session intents" ON public.session_intents;
CREATE POLICY "Users can read own session intents" ON public.session_intents
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own session intents" ON public.session_intents;
CREATE POLICY "Users can delete own session intents" ON public.session_intents
  FOR DELETE USING (auth.uid() = user_id);

-- 3. Personalization profile on users --------------------------------------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS interest_topics text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS consent_personalization boolean NOT NULL DEFAULT true;
