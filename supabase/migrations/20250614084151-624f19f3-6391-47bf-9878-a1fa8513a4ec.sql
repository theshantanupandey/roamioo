
-- Add trip join requests table
CREATE TABLE public.trip_join_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(trip_id, user_id)
);

-- Add RLS policies for trip join requests
ALTER TABLE public.trip_join_requests ENABLE ROW LEVEL SECURITY;

-- Users can view join requests for their own trips or their own requests
CREATE POLICY "Users can view relevant trip join requests" 
  ON public.trip_join_requests 
  FOR SELECT 
  USING (
    auth.uid() = user_id OR 
    auth.uid() IN (SELECT user_id FROM trips WHERE id = trip_id)
  );

-- Users can create join requests for trips
CREATE POLICY "Users can create trip join requests" 
  ON public.trip_join_requests 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Trip owners can update join request status
CREATE POLICY "Trip owners can update join requests" 
  ON public.trip_join_requests 
  FOR UPDATE 
  USING (auth.uid() IN (SELECT user_id FROM trips WHERE id = trip_id));

-- Users can delete their own requests
CREATE POLICY "Users can delete their own requests" 
  ON public.trip_join_requests 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add max_participants column to trips table
ALTER TABLE public.trips ADD COLUMN max_participants INTEGER DEFAULT 10;

-- Add trigger to update trip join requests updated_at
CREATE TRIGGER update_trip_join_requests_updated_at
  BEFORE UPDATE ON public.trip_join_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
