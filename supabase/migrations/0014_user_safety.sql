-- Migration 0014: User safety (Google Play UGC policy)
-- Adds the three controls Play requires for apps with publicly accessible
-- user-generated content:
--   1. users can block other users (conceals content + stops notifications)
--   2. users can report other users
--   3. recorded acceptance of the terms before users create content

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Blocks
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS user_blocks_blocker_id_idx ON public.user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS user_blocks_blocked_id_idx ON public.user_blocks(blocked_id);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- You can only see the people *you* blocked, never who blocked you.
CREATE POLICY "Users can view own blocks" ON public.user_blocks
  FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block others" ON public.user_blocks
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock" ON public.user_blocks
  FOR DELETE USING (auth.uid() = blocker_id);

-- Blocking severs the social graph both ways: all follows involving the pair
-- are removed so a blocked user is not an active follower any more.
CREATE OR REPLACE FUNCTION public.on_user_blocked()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.follows
  WHERE (follower_id = NEW.blocker_id AND following_id = NEW.blocked_id)
     OR (follower_id = NEW.blocked_id AND following_id = NEW.blocker_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_blocked_cleanup ON public.user_blocks;
CREATE TRIGGER user_blocked_cleanup
  AFTER INSERT ON public.user_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.on_user_blocked();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. User reports (moderation inbox; records only — action is manual/admin)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (reporter_id, reported_id)
);

CREATE INDEX IF NOT EXISTS user_reports_reported_id_idx ON public.user_reports(reported_id);

ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- Users can only file a report about themselves not... i.e. they may only
-- create their own reports. Reports are readable server-side (service role),
-- there is intentionally no SELECT policy for regular users.
CREATE POLICY "Users can report others" ON public.user_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id AND reported_id <> reporter_id);

-- Admins review reports with:
--   select * from public.user_reports order by created_at desc limit 50;
-- in the Supabase SQL Editor (or wire the admin console to the service role).

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Terms acceptance timestamp
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;

-- Existing users accepted the terms simply by using the service.
UPDATE public.users SET terms_accepted_at = now() WHERE terms_accepted_at IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Notifications must respect blocks: re-declare the 0013 trigger functions
--    with a block guard so a blocked user never notifies their blocker.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_blocked_by(receiver_id uuid, actor_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE blocker_id = receiver_id AND blocked_id = actor_id
  );
$$;

-- 4a. Comment / reply (as in 0013, plus the block guard).
CREATE OR REPLACE FUNCTION public.on_comment_created_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_idea_owner uuid;
  v_idea_title text;
  v_author text;
  v_parent_author uuid;
BEGIN
  SELECT user_id, title INTO v_idea_owner, v_idea_title
  FROM public.ideas WHERE id = NEW.idea_id;

  SELECT username INTO v_author
  FROM public.users WHERE id = NEW.author_id;

  IF NEW.parent_id IS NOT NULL THEN
    SELECT author_id INTO v_parent_author
    FROM public.comments WHERE id = NEW.parent_id;

    IF v_parent_author IS NOT NULL
       AND v_parent_author <> NEW.author_id
       AND NOT public.is_blocked_by(v_parent_author, NEW.author_id) THEN
      INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
      VALUES (
        v_parent_author,
        'reply',
        'New reply',
        COALESCE(v_author, 'Someone') || ' replied to your comment on "' || v_idea_title || '"',
        NEW.idea_id,
        'idea'
      );
    END IF;
  ELSIF v_idea_owner IS NOT NULL
        AND v_idea_owner <> NEW.author_id
        AND NOT public.is_blocked_by(v_idea_owner, NEW.author_id) THEN
    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (
      v_idea_owner,
      'comment',
      'New comment',
      COALESCE(v_author, 'Someone') || ' commented on "' || v_idea_title || '"',
      NEW.idea_id,
      'idea'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 4b. Follow (as in 0013, plus guard).
CREATE OR REPLACE FUNCTION public.on_follow_created_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_follower text;
BEGIN
  SELECT username INTO v_follower
  FROM public.users WHERE id = NEW.follower_id;

  IF NEW.following_id <> NEW.follower_id
     AND NOT public.is_blocked_by(NEW.following_id, NEW.follower_id) THEN
    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (
      NEW.following_id,
      'follow',
      'New follower',
      COALESCE(v_follower, 'Someone') || ' started following you',
      NEW.follower_id,
      'user'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 4c. Upvote (as in 0013, plus guard).
CREATE OR REPLACE FUNCTION public.on_upvote_created_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_title text;
  v_voter text;
BEGIN
  SELECT user_id, title INTO v_owner, v_title
  FROM public.ideas WHERE id = NEW.idea_id;

  SELECT username INTO v_voter
  FROM public.users WHERE id = NEW.user_id;

  IF v_owner IS NOT NULL
     AND v_owner <> NEW.user_id
     AND NOT public.is_blocked_by(v_owner, NEW.user_id) THEN
    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (
      v_owner,
      'upvote',
      'New upvote',
      COALESCE(v_voter, 'Someone') || ' upvoted "' || v_title || '"',
      NEW.idea_id,
      'idea'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 4d. Fork (as in 0013, plus guard).
CREATE OR REPLACE FUNCTION public.on_idea_forked_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_title text;
  v_forker text;
BEGIN
  SELECT user_id, title INTO v_owner, v_title
  FROM public.ideas WHERE id = NEW.idea_id;

  SELECT username INTO v_forker
  FROM public.users WHERE id = NEW.user_id;

  IF v_owner IS NOT NULL
     AND v_owner <> NEW.user_id
     AND NOT public.is_blocked_by(v_owner, NEW.user_id) THEN
    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (
      v_owner,
      'fork',
      'Your idea was forked',
      COALESCE(v_forker, 'Someone') || ' built on "' || v_title || '"',
      NEW.forked_idea_id,
      'idea'
    );
  END IF;

  RETURN NEW;
END;
$$;
