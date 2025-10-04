-- Fix group_chats RLS policy to ensure authenticated users can create chats
DROP POLICY IF EXISTS "Authenticated users can create group chats" ON public.group_chats;

CREATE POLICY "Authenticated users can create group chats"
ON public.group_chats
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by AND auth.uid() IS NOT NULL);

-- Ensure trip creators are automatically added as participants
-- First, add trip creator to trip_participants on trip creation
CREATE OR REPLACE FUNCTION public.add_trip_creator_as_participant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Add the trip creator as a participant with organizer role
  INSERT INTO public.trip_participants (trip_id, user_id, role, status)
  VALUES (NEW.id, NEW.user_id, 'organizer', 'accepted')
  ON CONFLICT (trip_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically add trip creator as participant
DROP TRIGGER IF EXISTS add_trip_creator_trigger ON public.trips;
CREATE TRIGGER add_trip_creator_trigger
AFTER INSERT ON public.trips
FOR EACH ROW
EXECUTE FUNCTION public.add_trip_creator_as_participant();

-- Add unique constraint to prevent duplicate participants if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'trip_participants_trip_id_user_id_key'
  ) THEN
    ALTER TABLE public.trip_participants 
    ADD CONSTRAINT trip_participants_trip_id_user_id_key 
    UNIQUE (trip_id, user_id);
  END IF;
END $$;