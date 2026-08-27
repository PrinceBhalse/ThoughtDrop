-- 0004: Infrastructure & Feed Performance
-- Run this in the Supabase Dashboard > SQL Editor.

-- 1. Featured flag: reserve a first-class slot for "Featured Ideas" / sponsors.
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

-- 2. Feed performance indexes (main feed sorts by created_at desc; category/community filters)
CREATE INDEX IF NOT EXISTS ideas_created_at_idx ON public.ideas(created_at DESC);
CREATE INDEX IF NOT EXISTS ideas_category_idx ON public.ideas(category);
CREATE INDEX IF NOT EXISTS ideas_community_idx ON public.ideas(community_id);
CREATE INDEX IF NOT EXISTS ideas_status_idx ON public.ideas(status);
