-- 0003: Admin Injection & Crowdsourced Moderation
-- Run this in the Supabase Dashboard > SQL Editor.

-- 1. Add an is_hidden flag to ideas (used to auto-hide reported content pending admin review)
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;

-- 2. Crowdsourced moderation: idea_reports table
CREATE TABLE IF NOT EXISTS public.idea_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (idea_id, user_id)
);

ALTER TABLE public.idea_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can report ideas" ON public.idea_reports
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- No SELECT/UPDATE/DELETE policies: reporting goes through the RPC below,
-- and listing is app-level via ideas.is_hidden.

-- 3. report_idea: records a report and auto-hides the idea once the threshold is reached.
CREATE OR REPLACE FUNCTION public.report_idea(
  target_id UUID,
  report_reason TEXT DEFAULT NULL,
  threshold INT DEFAULT 3
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
  v_hidden BOOLEAN := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.idea_reports (idea_id, user_id, reason)
  VALUES (target_id, auth.uid(), report_reason)
  ON CONFLICT (idea_id, user_id) DO NOTHING;

  SELECT COUNT(*) INTO v_count FROM public.idea_reports WHERE idea_id = target_id;

  IF v_count >= threshold THEN
    UPDATE public.ideas SET is_hidden = true WHERE id = target_id;
    v_hidden := true;
  END IF;

  RETURN v_hidden;
END;
$$;

-- 4. Admin helpers
CREATE OR REPLACE FUNCTION public.approve_idea(target_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.ideas SET is_hidden = false WHERE id = target_id;
  DELETE FROM public.idea_reports WHERE idea_id = target_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.hide_idea(target_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.ideas SET is_hidden = true WHERE id = target_id;
END;
$$;

-- 5. admin_inject_idea: lets a verified admin seed curated, real-world concepts
--    bypassing RLS. The idea is attributed anonymously (user_id = NULL).
CREATE OR REPLACE FUNCTION public.admin_inject_idea(
  p_title TEXT,
  p_content TEXT,
  p_content_html TEXT DEFAULT NULL,
  p_category TEXT DEFAULT 'Tech',
  p_status TEXT DEFAULT 'Concept',
  p_community_id UUID DEFAULT NULL,
  p_required_roles TEXT[] DEFAULT '{}'::TEXT[],
  p_is_adult BOOLEAN DEFAULT false,
  p_is_nda_protected BOOLEAN DEFAULT false
)
RETURNS public.ideas
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_idea public.ideas;
BEGIN
  INSERT INTO public.ideas (
    user_id, title, content, content_html, category, status, community_id,
    required_roles, is_adult, is_nda_protected, is_hidden
  )
  VALUES (
    NULL, p_title, p_content, p_content_html, p_category, p_status, p_community_id,
    p_required_roles, p_is_adult, p_is_nda_protected, false
  )
  RETURNING * INTO v_idea;

  RETURN v_idea;
END;
$$;
