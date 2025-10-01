
-- Drop existing problematic policies for trips table
DROP POLICY IF EXISTS "Users can view their own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can create trips" ON public.trips;
DROP POLICY IF EXISTS "Users can update their own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can delete their own trips" ON public.trips;

-- Create new, properly structured RLS policies for trips
CREATE POLICY "Users can view their own trips" 
  ON public.trips 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trips" 
  ON public.trips 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trips" 
  ON public.trips 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trips" 
  ON public.trips 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Ensure RLS is enabled on trips table
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
