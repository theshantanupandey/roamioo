
-- Remove the BEFORE UPDATE trigger for updated_at if it exists
DROP TRIGGER IF EXISTS update_trips_updated_at ON public.trips;

-- Remove possible duplicate user stats triggers
DROP TRIGGER IF EXISTS update_user_stats_on_trip_change ON public.trips;

-- Re-create the updated_at trigger properly
CREATE TRIGGER update_trips_updated_at
BEFORE UPDATE ON public.trips
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Recreate the user stats trigger (single instance)
CREATE TRIGGER update_user_stats_on_trip_change
AFTER INSERT OR UPDATE OR DELETE ON public.trips
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_user_stats();
