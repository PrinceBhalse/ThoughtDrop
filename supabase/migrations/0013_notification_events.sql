-- Migration 0013: Notification events, forks
-- Fills the gap between the notifications table (0010) and the activity that
-- should populate it. Every trigger below writes exactly one row per event and
-- never notifies a user about their own action.

-- 1. 'fork' becomes a valid notification type.
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('upvote', 'comment', 'reply', 'follow', 'fork', 'workspace_join', 'mention'));

-- 2. Fork tracking: an idea can be derived from another idea.
ALTER TABLE public.ideas
  ADD COLUMN IF NOT EXISTS forked_from_id uuid REFERENCES public.ideas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS forks_count integer DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.idea_forks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  forked_idea_id uuid NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(idea_id, forked_idea_id, user_id)
);

CREATE INDEX IF NOT EXISTS idea_forks_idea_id_idx ON public.idea_forks(idea_id);
CREATE INDEX IF NOT EXISTS idea_forks_forked_idea_id_idx ON public.idea_forks(forked_idea_id);

ALTER TABLE public.idea_forks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Forks are viewable by everyone"
  ON public.idea_forks FOR SELECT
  USING (true);

CREATE POLICY "Users can fork ideas"
  ON public.idea_forks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own forks"
  ON public.idea_forks FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Event triggers.

-- 3a. Comment or reply on an idea.
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

    IF v_parent_author IS NOT NULL AND v_parent_author <> NEW.author_id THEN
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
  ELSIF v_idea_owner IS NOT NULL AND v_idea_owner <> NEW.author_id THEN
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

DROP TRIGGER IF EXISTS comment_created_notify ON public.comments;
CREATE TRIGGER comment_created_notify
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.on_comment_created_notify();

-- 3b. Someone follows a creator.
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

  IF NEW.following_id <> NEW.follower_id THEN
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

DROP TRIGGER IF EXISTS follow_created_notify ON public.follows;
CREATE TRIGGER follow_created_notify
  AFTER INSERT ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.on_follow_created_notify();

-- 3c. An idea is upvoted.
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

  IF v_owner IS NOT NULL AND v_owner <> NEW.user_id THEN
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

DROP TRIGGER IF EXISTS upvote_created_notify ON public.upvotes;
CREATE TRIGGER upvote_created_notify
  AFTER INSERT ON public.upvotes
  FOR EACH ROW
  EXECUTE FUNCTION public.on_upvote_created_notify();

-- 3d. An idea is forked.
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

  IF v_owner IS NOT NULL AND v_owner <> NEW.user_id THEN
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

DROP TRIGGER IF EXISTS idea_forked_notify ON public.idea_forks;
CREATE TRIGGER idea_forked_notify
  AFTER INSERT ON public.idea_forks
  FOR EACH ROW
  EXECUTE FUNCTION public.on_idea_forked_notify();

-- 3e. Keep ideas.forks_count and ideas.comments_count in sync.
CREATE OR REPLACE FUNCTION public.on_idea_forks_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.ideas
      SET forks_count = forks_count + 1
      WHERE id = NEW.idea_id;
    RETURN NEW;
  ELSE
    UPDATE public.ideas
      SET forks_count = GREATEST(0, forks_count - 1)
      WHERE id = OLD.idea_id;
    RETURN OLD;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS idea_forks_count_trigger ON public.idea_forks;
CREATE TRIGGER idea_forks_count_trigger
  AFTER INSERT OR DELETE ON public.idea_forks
  FOR EACH ROW
  EXECUTE FUNCTION public.on_idea_forks_count();

CREATE OR REPLACE FUNCTION public.on_idea_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.ideas
      SET comments_count = comments_count + 1
      WHERE id = NEW.idea_id;
    RETURN NEW;
  ELSE
    UPDATE public.ideas
      SET comments_count = GREATEST(0, comments_count - 1)
      WHERE id = OLD.idea_id;
    RETURN OLD;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS idea_comments_count_trigger ON public.comments;
CREATE TRIGGER idea_comments_count_trigger
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.on_idea_comments_count();
