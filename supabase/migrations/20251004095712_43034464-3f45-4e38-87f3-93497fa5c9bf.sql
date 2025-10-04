-- Add path_id column to posts table to support path posts
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS path_id UUID REFERENCES public.travel_paths(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_posts_path_id ON public.posts(path_id);