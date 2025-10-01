
-- Drop all old policies on trip_participants to ensure a clean slate.
DROP POLICY IF EXISTS "1. Owners have full access to participants" ON public.trip_participants;
DROP POLICY IF EXISTS "2. Participants can view other participants" ON public.trip_participants;
DROP POLICY IF EXISTS "3. Participants can leave a trip" ON public.trip_participants;
DROP POLICY IF EXISTS "Allow trip owners to manage participants" ON public.trip_participants;
DROP POLICY IF EXISTS "Participants can view other participants" ON public.trip_participants;
DROP POLICY IF EXISTS "Participants can leave a trip" ON public.trip_participants;
DROP POLICY IF EXISTS "Enable read access for trip participants" ON public.trip_participants;
DROP POLICY IF EXISTS "Users can view trip participants" ON public.trip_participants;
DROP POLICY IF EXISTS "Users can view their own trip participations" ON public.trip_participants;

-- Recreate helper function to check if the current user is the trip owner.
-- Using SECURITY DEFINER and STABLE to prevent recursion and aid query planner.
CREATE OR REPLACE FUNCTION public.is_trip_owner(p_trip_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.trips WHERE id = p_trip_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Recreate helper function to check if the current user is a participant.
CREATE OR REPLACE FUNCTION public.is_trip_participant(p_trip_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.trip_participants WHERE trip_id = p_trip_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 1. Owners have full access to manage participants of their trips.
CREATE POLICY "Owners can manage trip participants"
ON public.trip_participants
FOR ALL
USING (public.is_trip_owner(trip_id))
WITH CHECK (public.is_trip_owner(trip_id));

-- 2. Participants can view other participants of the same trip.
CREATE POLICY "Participants can view other participants"
ON public.trip_participants
FOR SELECT
USING (public.is_trip_participant(trip_id));

-- 3. Participants can remove themselves from a trip.
CREATE POLICY "Participants can leave a trip"
ON public.trip_participants
FOR DELETE
USING (user_id = auth.uid());
