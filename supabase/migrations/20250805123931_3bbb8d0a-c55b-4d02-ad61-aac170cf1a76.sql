-- Create activity triggers for like, comment, and follow actions

-- Function to create activity notifications
CREATE OR REPLACE FUNCTION create_activity_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- For post likes
  IF TG_TABLE_NAME = 'post_likes' THEN
    -- Get the post owner
    INSERT INTO activities (user_id, actor_id, entity_id, entity_type, type, message)
    SELECT 
      p.user_id,
      NEW.user_id,
      NEW.post_id,
      'post',
      'post_liked',
      'liked your post'
    FROM posts p 
    WHERE p.id = NEW.post_id 
    AND p.user_id != NEW.user_id; -- Don't notify self
    
  -- For post comments  
  ELSIF TG_TABLE_NAME = 'post_comments' THEN
    -- Get the post owner
    INSERT INTO activities (user_id, actor_id, entity_id, entity_type, type, message)
    SELECT 
      p.user_id,
      NEW.user_id,
      NEW.post_id,
      'post',
      'post_commented',
      'commented on your post'
    FROM posts p 
    WHERE p.id = NEW.post_id 
    AND p.user_id != NEW.user_id; -- Don't notify self
    
  -- For user follows
  ELSIF TG_TABLE_NAME = 'user_follows' THEN
    INSERT INTO activities (user_id, actor_id, entity_id, entity_type, type, message)
    VALUES (
      NEW.following_id,  -- The user being followed
      NEW.follower_id,   -- The user doing the following
      NEW.following_id,  -- Entity is the user being followed
      'user',
      'user_followed',
      'started following you'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for post likes
DROP TRIGGER IF EXISTS post_likes_activity_trigger ON post_likes;
CREATE TRIGGER post_likes_activity_trigger
  AFTER INSERT ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION create_activity_notification();

-- Create triggers for post comments
DROP TRIGGER IF EXISTS post_comments_activity_trigger ON post_comments;
CREATE TRIGGER post_comments_activity_trigger
  AFTER INSERT ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION create_activity_notification();

-- Create triggers for user follows
DROP TRIGGER IF EXISTS user_follows_activity_trigger ON user_follows;
CREATE TRIGGER user_follows_activity_trigger
  AFTER INSERT ON user_follows
  FOR EACH ROW
  EXECUTE FUNCTION create_activity_notification();