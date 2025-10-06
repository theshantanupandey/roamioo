-- Add destination field to travel_paths table
ALTER TABLE public.travel_paths
ADD COLUMN IF NOT EXISTS destination VARCHAR(255);