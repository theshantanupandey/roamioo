-- Migration: Integrate Paths with Trips
-- This migration adds the ability to link travel paths with trips

-- Add path_id column to trips table to link trips with paths
ALTER TABLE trips ADD COLUMN IF NOT EXISTS path_id UUID REFERENCES travel_paths(id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_trips_path_id ON trips(path_id);

-- Add path_type to identify how the path was created
ALTER TABLE trips ADD COLUMN IF NOT EXISTS path_type VARCHAR DEFAULT 'none' CHECK (path_type IN ('none', 'manual', 'ai_generated', 'existing'));

-- Add trip_id to posts table to better track trip-based posts
-- (This may already exist but ensuring it's there)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES trips(id);

-- Update the trips table to include path metadata
ALTER TABLE trips ADD COLUMN IF NOT EXISTS path_metadata JSONB DEFAULT '{}';

-- Comments for documentation
COMMENT ON COLUMN trips.path_id IS 'Reference to the travel path associated with this trip';
COMMENT ON COLUMN trips.path_type IS 'How the path was created: none, manual, ai_generated, or existing';
COMMENT ON COLUMN trips.path_metadata IS 'Additional metadata about the path creation (AI parameters, source path info, etc.)';

-- Create a view for trips with path details for easier querying
CREATE OR REPLACE VIEW trips_with_paths AS
SELECT 
  t.*,
  tp.title as path_title,
  tp.description as path_description,
  tp.difficulty_level,
  tp.estimated_duration,
  tp.average_rating as path_rating,
  tp.total_reviews as path_reviews,
  tp.image_url as path_image_url,
  (
    SELECT COUNT(*) 
    FROM path_waypoints pw 
    WHERE pw.path_id = tp.id
  ) as waypoints_count
FROM trips t
LEFT JOIN travel_paths tp ON t.path_id = tp.id;

-- Grant permissions
GRANT SELECT ON trips_with_paths TO authenticated;
