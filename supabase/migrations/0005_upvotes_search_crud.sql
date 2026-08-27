-- 0005: Upvoting persistence, full-text search, and edit/delete support
-- Run this in the Supabase Dashboard > SQL Editor.

-- 1. Ensure the upvotes table exists (defined in 0000 but guarded here for partial applies).
CREATE TABLE IF NOT EXISTS public.upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(idea_id, user_id)
);

ALTER TABLE public.upvotes ENABLE ROW LEVEL SECURITY;

-- 2. toggle_upvote: atomically insert/delete an upvote and keep ideas.upvotes_count in sync.
--    Returns true if the idea is newly upvoted by the caller, false if it was removed (NULL for anonymous).
CREATE OR REPLACE FUNCTION public.toggle_upvote(target_idea_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.upvotes WHERE idea_id = target_idea_id AND user_id = auth.uid()
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM public.upvotes WHERE idea_id = target_idea_id AND user_id = auth.uid();
    UPDATE public.ideas SET upvotes_count = GREATEST(0, upvotes_count - 1) WHERE id = target_idea_id;
    RETURN false;
  ELSE
    INSERT INTO public.upvotes (idea_id, user_id) VALUES (target_idea_id, auth.uid());
    UPDATE public.ideas SET upvotes_count = upvotes_count + 1 WHERE id = target_idea_id;
    RETURN true;
  END IF;
END;
$$;

-- 3. Full-text search support.
--    search_text is a generated column combining title + plain content for consistent querying.
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS search_text TEXT GENERATED ALWAYS AS (
  coalesce(title, '') || ' ' || coalesce(content, '')
) STORED;

CREATE INDEX IF NOT EXISTS ideas_search_idx ON public.ideas
  USING GIN (to_tsvector('english', search_text));

ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS search_text TEXT GENERATED ALWAYS AS (
  coalesce(name, '') || ' ' || coalesce(description, '')
) STORED;

CREATE INDEX IF NOT EXISTS communities_search_idx ON public.communities
  USING GIN (to_tsvector('english', search_text));

-- 4. Edit/delete support: RLS already restricts UPDATE/DELETE to the owner (auth.uid() = user_id)
--    from migration 0000, so no extra policies are required here.
