-- Function to update post comment count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for post comments
DROP TRIGGER IF EXISTS trigger_update_post_comments_count_insert ON post_comments;
DROP TRIGGER IF EXISTS trigger_update_post_comments_count_delete ON post_comments;

CREATE TRIGGER trigger_update_post_comments_count_insert
    AFTER INSERT ON post_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_post_comments_count();

CREATE TRIGGER trigger_update_post_comments_count_delete
    AFTER DELETE ON post_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_post_comments_count();

-- Fix existing comment counts
UPDATE posts SET comments_count = (
    SELECT COUNT(*) FROM post_comments WHERE post_id = posts.id
);