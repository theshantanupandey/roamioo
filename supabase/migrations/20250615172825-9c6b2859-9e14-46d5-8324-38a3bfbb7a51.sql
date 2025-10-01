
-- Policy: Trip owner can manage all participants (add/remove)
CREATE POLICY "Trip owner manages participants"
ON public.trip_participants
FOR ALL
USING (EXISTS (SELECT 1 FROM public.trips WHERE trips.id = trip_participants.trip_id AND trips.user_id = auth.uid()));

-- Policy: Participants can see their own participations
CREATE POLICY "Participants can view their own trip participations"
ON public.trip_participants
FOR SELECT
USING (user_id = auth.uid());

-- Policy: Participants can leave the trip (delete their own row)
CREATE POLICY "Participants can leave trip"
ON public.trip_participants
FOR DELETE
USING (user_id = auth.uid());
