
-- Enable RLS on post_comments table and create policies
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for post comments
CREATE POLICY "Anyone can view comments on public posts" ON post_comments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM posts 
    WHERE posts.id = post_comments.post_id 
    AND posts.privacy_level = 'public'
  )
);

CREATE POLICY "Authenticated users can create comments" ON post_comments
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON post_comments
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON post_comments
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create comment_likes table for liking comments
CREATE TABLE comment_likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id uuid REFERENCES post_comments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(comment_id, user_id)
);

-- Enable RLS on comment_likes
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for comment likes
CREATE POLICY "Anyone can view comment likes" ON comment_likes
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like comments" ON comment_likes
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own comment likes" ON comment_likes
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Add likes_count to post_comments
ALTER TABLE post_comments ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0;

-- Add theme preference to user_settings
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS theme character varying DEFAULT 'light';

-- Enable RLS on user_follows for better access control
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Create policies for user_follows
CREATE POLICY "Users can view their own follows" ON user_follows
FOR SELECT TO authenticated USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can follow others" ON user_follows
FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others" ON user_follows
FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- Function to update comment likes count
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE post_comments 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE post_comments 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for comment likes count
CREATE TRIGGER comment_likes_count_trigger
  AFTER INSERT OR DELETE ON comment_likes
  FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

-- Function to update post comments count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET comments_count = comments_count - 1 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for post comments count
CREATE TRIGGER post_comments_count_trigger
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();
