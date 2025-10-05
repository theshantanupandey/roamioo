-- Add image_url column to path_waypoints table for storing stop images
ALTER TABLE public.path_waypoints
ADD COLUMN image_url TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN public.path_waypoints.image_url IS 'URL of the image for this waypoint/stop in the travel path';