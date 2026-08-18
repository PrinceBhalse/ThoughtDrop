-- Create custom users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  date_of_birth DATE,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies for users
CREATE POLICY "Public profiles are viewable by everyone." ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Create ideas table
CREATE TABLE public.ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- Nullable for anonymous
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Business', 'Creative', 'Tech', 'Social Impact')),
  status TEXT NOT NULL CHECK (status IN ('Concept', 'In Progress', 'Seeking Collaborators', 'Launched')),
  is_adult BOOLEAN DEFAULT false,
  upvotes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

-- Policies for ideas
CREATE POLICY "Ideas are viewable by everyone." ON public.ideas
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert ideas." ON public.ideas
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  
CREATE POLICY "Users can update their own ideas." ON public.ideas
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete their own ideas." ON public.ideas
  FOR DELETE USING (auth.uid() = user_id);

-- Create comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Policies for comments
CREATE POLICY "Comments are viewable by everyone." ON public.comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert comments." ON public.comments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own comments." ON public.comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments." ON public.comments
  FOR DELETE USING (auth.uid() = user_id);

-- Create upvotes table to track user upvotes
CREATE TABLE public.upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(idea_id, user_id)
);

-- Enable RLS
ALTER TABLE public.upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Upvotes are viewable by everyone." ON public.upvotes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert upvotes." ON public.upvotes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own upvotes." ON public.upvotes
  FOR DELETE USING (auth.uid() = user_id);
