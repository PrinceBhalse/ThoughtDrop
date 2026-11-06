-- Migration 0007: Threaded Comments
-- Comments on ideas with full threading support.
--
-- This file is safe to run on BOTH of these databases:
--   a) a project that already applied 0000 (comments has user_id, no author_id/parent_id/updated_at)
--   b) a fresh project that applied 0000 too (0000 creates comments with user_id)
-- It upgrades the legacy comments table in place, preserving existing rows.

-- 1. Add the new columns (no-ops on a table that already has them).
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Backfill author_id from the legacy user_id column (guarded so the script
--    is safe even if an earlier run already dropped it).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'user_id'
  ) THEN
    UPDATE public.comments SET author_id = user_id WHERE author_id IS NULL;
  END IF;
END $$;

-- 3. The backfill is complete by definition; lock the column down.
ALTER TABLE public.comments ALTER COLUMN author_id SET NOT NULL;

-- 4. Drop the legacy 0000 policies FIRST — they depend on user_id,
--    so the column cannot be dropped while they exist.
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments are viewable by everyone." ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments." ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments." ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments." ON public.comments;
-- 0007-era names (in case this file ran partially before)
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;

-- 4b. Now the legacy column can be dropped.
ALTER TABLE public.comments DROP COLUMN IF EXISTS user_id;

-- 5. Indexes for common queries
CREATE INDEX IF NOT EXISTS comments_idea_id_idx ON public.comments(idea_id);
CREATE INDEX IF NOT EXISTS comments_parent_id_idx ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS comments_author_id_idx ON public.comments(author_id);
CREATE INDEX IF NOT EXISTS comments_created_at_idx ON public.comments(created_at);

-- 6. RLS: Anyone can read; signed-in users can write their own.
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone"
  ON public.comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  USING (auth.uid() = author_id);

-- 7. Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_comments_updated_at ON public.comments;
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 8. comments_count on ideas for fast display
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS comments_count integer DEFAULT 0;

-- 9. Backfill comments_count from the now-consistent table.
UPDATE public.ideas i
SET comments_count = COALESCE((SELECT count(*) FROM public.comments c WHERE c.idea_id = i.id), 0)
WHERE i.comments_count IS NULL OR i.comments_count = 0;
