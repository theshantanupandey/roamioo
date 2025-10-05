-- Add unique constraint to user_followed_paths to prevent duplicates
-- This ensures a user can only have one relationship with a path
ALTER TABLE public.user_followed_paths 
DROP CONSTRAINT IF EXISTS user_followed_paths_user_id_path_id_key;

ALTER TABLE public.user_followed_paths 
ADD CONSTRAINT user_followed_paths_user_id_path_id_key 
UNIQUE (user_id, path_id);