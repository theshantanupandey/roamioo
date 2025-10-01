
-- Create storage buckets for the application
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('posts', 'posts', true, 104857600, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/x-msvideo'])
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/x-msvideo'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('reviews', 'reviews', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('profiles', 'profiles', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('travel-paths', 'travel-paths', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the posts bucket
CREATE POLICY "Anyone can view files in posts bucket" ON storage.objects
FOR SELECT USING (bucket_id = 'posts');

CREATE POLICY "Authenticated users can upload to posts bucket" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'posts');

CREATE POLICY "Users can update their own files in posts bucket" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own files in posts bucket" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create RLS policies for other buckets
CREATE POLICY "Anyone can view files in reviews bucket" ON storage.objects
FOR SELECT USING (bucket_id = 'reviews');

CREATE POLICY "Authenticated users can upload to reviews bucket" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'reviews');

CREATE POLICY "Anyone can view files in profiles bucket" ON storage.objects
FOR SELECT USING (bucket_id = 'profiles');

CREATE POLICY "Authenticated users can upload to profiles bucket" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'profiles');

CREATE POLICY "Anyone can view files in travel-paths bucket" ON storage.objects
FOR SELECT USING (bucket_id = 'travel-paths');

CREATE POLICY "Authenticated users can upload to travel-paths bucket" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'travel-paths');
