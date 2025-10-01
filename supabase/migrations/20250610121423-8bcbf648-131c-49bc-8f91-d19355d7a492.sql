
-- Create storage bucket for posts
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'posts', 
  'posts', 
  true, 
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Create RLS policies for the posts bucket
CREATE POLICY "Anyone can view post images" ON storage.objects
FOR SELECT USING (bucket_id = 'posts');

CREATE POLICY "Authenticated users can upload post images" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'posts');

CREATE POLICY "Users can update their own post images" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own post images" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add likes_count and comments_count to journal_entries for when they become posts
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS comments_count integer DEFAULT 0;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS is_posted boolean DEFAULT false;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS post_id uuid REFERENCES posts(id);

-- Update posts table to reference journal entries
ALTER TABLE posts ADD COLUMN IF NOT EXISTS journal_entry_id uuid REFERENCES journal_entries(id);

-- Enable RLS on users table to allow viewing usernames
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to view basic user info (username, name, profile image)
CREATE POLICY "Everyone can view basic user info" ON users
FOR SELECT USING (true);

-- Create policy for users to update their own profile
CREATE POLICY "Users can update their own profile" ON users
FOR UPDATE TO authenticated USING (id = auth.uid());

-- Create policy for users to insert their own profile
CREATE POLICY "Users can insert their own profile" ON users
FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
