
-- Create trip-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('trip-images', 'trip-images', true);

-- Create RLS policies for trip-images bucket
CREATE POLICY "Anyone can view trip images" ON storage.objects
FOR SELECT USING (bucket_id = 'trip-images');

CREATE POLICY "Users can upload trip images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'trip-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own trip images" ON storage.objects
FOR UPDATE USING (bucket_id = 'trip-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own trip images" ON storage.objects
FOR DELETE USING (bucket_id = 'trip-images' AND auth.uid()::text = (storage.foldername(name))[1]);
