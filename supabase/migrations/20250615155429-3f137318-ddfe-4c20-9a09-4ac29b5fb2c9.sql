
-- Create a helper function to check if the current user is the trip owner.
-- Using a SECURITY DEFINER function prevents infinite recursion in RLS policies.
CREATE OR REPLACE FUNCTION public.is_trip_owner(p_trip_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.trips
    WHERE id = p_trip_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a helper function to check if the current user is a participant.
-- This also uses SECURITY DEFINER to avoid recursion.
CREATE OR REPLACE FUNCTION public.is_trip_participant(p_trip_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.trip_participants
    WHERE trip_id = p_trip_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop potentially conflicting old policies before creating new ones.
DROP POLICY IF EXISTS "Trip owners can manage participants" ON public.trip_participants;
DROP POLICY IF EXISTS "Participants can view other participants" ON public.trip_participants;
DROP POLICY IF EXISTS "Participants can leave a trip" ON public.trip_participants;
DROP POLICY IF EXISTS "Enable read access for trip participants" ON public.trip_participants;
DROP POLICY IF EXISTS "Users can view trip participants" ON public.trip_participants;
DROP POLICY IF EXISTS "Allow trip owners to manage participants" ON public.trip_participants;
DROP POLICY IF EXISTS "Users can view their own trip participations" ON public.trip_participants;

-- 1. Trip owners have full access to manage participants.
CREATE POLICY "Allow trip owners to manage participants"
ON public.trip_participants
FOR ALL
USING (public.is_trip_owner(trip_id))
WITH CHECK (public.is_trip_owner(trip_id));

-- 2. Trip participants can see other participants of the same trip.
CREATE POLICY "Participants can view other participants"
ON public.trip_participants
FOR SELECT
USING (public.is_trip_participant(trip_id));

-- 3. Authenticated users can remove themselves from a trip (leave).
CREATE POLICY "Participants can leave a trip"
ON public.trip_participants
FOR DELETE
USING (user_id = auth.uid());

