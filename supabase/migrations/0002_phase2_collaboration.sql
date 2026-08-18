-- Create communities table
CREATE TABLE public.communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for communities
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Communities are viewable by everyone." ON public.communities
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert communities." ON public.communities
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Modify ideas table
ALTER TABLE public.ideas 
  ADD COLUMN community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL,
  ADD COLUMN required_roles TEXT[] DEFAULT '{}'::TEXT[];

-- Create workspace_messages table for real-time chat
CREATE TABLE public.workspace_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for workspace_messages
ALTER TABLE public.workspace_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace messages are viewable by everyone." ON public.workspace_messages
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert workspace messages." ON public.workspace_messages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Enable Realtime for workspace_messages
-- (Note: This is often done via Supabase Dashboard UI or specific SQL commands if supported)
-- We'll assume the publication exists or we enable it here:
alter publication supabase_realtime add table public.workspace_messages;
