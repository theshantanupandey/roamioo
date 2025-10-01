
-- Allow all users to SELECT trips where privacy_level = 'public'
CREATE POLICY "Users can view public trips" 
  ON public.trips 
  FOR SELECT 
  USING (privacy_level = 'public');

-- NOTE: This is in addition to your current owner-only policy:
-- CREATE POLICY "Users can view their own trips"
--   ON public.trips
--   FOR SELECT
--   USING (auth.uid() = user_id);

-- This way, trip creators can see their own private and public trips,
-- and all users can see public trips for discovery/joining.
