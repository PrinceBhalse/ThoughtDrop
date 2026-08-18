-- Add new columns to ideas table
ALTER TABLE public.ideas 
  ADD COLUMN parent_idea_id UUID REFERENCES public.ideas(id) ON DELETE SET NULL,
  ADD COLUMN is_nda_protected BOOLEAN DEFAULT false,
  ADD COLUMN content_html TEXT;

-- For existing rows, copy content to content_html if we want, or leave it and handle nulls in UI
-- We will just assume content_html can be null and fall back to content if it is.

-- Create nda_signatures table
CREATE TABLE public.nda_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  signed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(idea_id, user_id)
);

-- Enable RLS for nda_signatures
ALTER TABLE public.nda_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own signatures" ON public.nda_signatures
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Idea owners can view signatures on their ideas" ON public.nda_signatures
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ideas 
      WHERE ideas.id = nda_signatures.idea_id 
      AND ideas.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own signatures" ON public.nda_signatures
  FOR INSERT WITH CHECK (auth.uid() = user_id);
