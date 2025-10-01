-- Add path_id column to trips table to support travel paths
ALTER TABLE public.trips 
ADD COLUMN IF NOT EXISTS path_id UUID REFERENCES public.travel_paths(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_trips_path_id ON public.trips(path_id);