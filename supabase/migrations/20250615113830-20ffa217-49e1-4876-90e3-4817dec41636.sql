
-- Step 1: Drop the triggers that depend on the function
DROP TRIGGER IF EXISTS update_user_stats_on_post_change ON public.posts;
DROP TRIGGER IF EXISTS update_user_stats_on_trip_change ON public.trips;

-- Step 2: Drop the old function
DROP FUNCTION IF EXISTS public.trigger_update_user_stats;

-- Step 3: Recreate the function (it handles both posts and trips)
CREATE OR REPLACE FUNCTION public.trigger_update_user_stats()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  affected_user uuid;
BEGIN
  IF TG_TABLE_NAME = 'posts' THEN
    IF (TG_OP = 'DELETE') THEN
      affected_user := OLD.user_id;
    ELSE
      affected_user := NEW.user_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'trips' THEN
    IF (TG_OP = 'DELETE') THEN
      affected_user := OLD.user_id;
    ELSE
      affected_user := NEW.user_id;
    END IF;
  ELSE
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Update stats for only the affected user
  UPDATE public.users 
  SET total_posts = (
    SELECT COUNT(*) 
    FROM public.posts 
    WHERE posts.user_id = affected_user
  ),
  total_likes_received = (
    SELECT COALESCE(SUM(posts.likes_count), 0)
    FROM public.posts 
    WHERE posts.user_id = affected_user
  ),
  trips_completed = (
    SELECT COUNT(*) 
    FROM public.trips 
    WHERE trips.user_id = affected_user
      AND trips.status = 'completed'
  ),
  credits_earned = (
    (SELECT COUNT(*) FROM public.posts WHERE posts.user_id = affected_user) * 10
    + (SELECT COALESCE(SUM(posts.likes_count),0) FROM public.posts WHERE posts.user_id = affected_user) * 2
  ),
  romio_level = CASE 
    WHEN (
      ((SELECT COUNT(*) FROM public.posts WHERE posts.user_id = affected_user) * 10)
      + (SELECT COALESCE(SUM(posts.likes_count),0) FROM public.posts WHERE posts.user_id = affected_user) * 2
    ) >= 1000 THEN 'Master Explorer'
    WHEN (
      ((SELECT COUNT(*) FROM public.posts WHERE posts.user_id = affected_user) * 10)
      + (SELECT COALESCE(SUM(posts.likes_count),0) FROM public.posts WHERE posts.user_id = affected_user) * 2
    ) >= 500 THEN 'Expert Traveler'
    WHEN (
      ((SELECT COUNT(*) FROM public.posts WHERE posts.user_id = affected_user) * 10)
      + (SELECT COALESCE(SUM(posts.likes_count),0) FROM public.posts WHERE posts.user_id = affected_user) * 2
    ) >= 200 THEN 'Adventure Seeker'
    WHEN (
      ((SELECT COUNT(*) FROM public.posts WHERE posts.user_id = affected_user) * 10)
      + (SELECT COALESCE(SUM(posts.likes_count),0) FROM public.posts WHERE posts.user_id = affected_user) * 2
    ) >= 50 THEN 'Journey Enthusiast'
    ELSE 'Explorer'
  END
  WHERE users.id = affected_user;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Step 4: Recreate both triggers

-- For trips table
CREATE TRIGGER update_user_stats_on_trip_change
AFTER INSERT OR UPDATE OR DELETE ON public.trips
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_user_stats();

-- For posts table
CREATE TRIGGER update_user_stats_on_post_change
AFTER INSERT OR UPDATE OR DELETE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_user_stats();
