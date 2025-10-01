
-- Add video_url column to posts table for proper video storage (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'video_url') THEN
        ALTER TABLE posts ADD COLUMN video_url TEXT;
    END IF;
END $$;

-- Drop existing policies if they exist before recreating
DROP POLICY IF EXISTS "Users can view public vlogs" ON vlogs;
DROP POLICY IF EXISTS "Users can create their own vlogs" ON vlogs;
DROP POLICY IF EXISTS "Users can update their own vlogs" ON vlogs;
DROP POLICY IF EXISTS "Users can delete their own vlogs" ON vlogs;

-- Create policies for vlogs
CREATE POLICY "Users can view public vlogs" ON vlogs
  FOR SELECT USING (privacy_level = 'public');

CREATE POLICY "Users can create their own vlogs" ON vlogs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vlogs" ON vlogs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vlogs" ON vlogs
  FOR DELETE USING (auth.uid() = user_id);
