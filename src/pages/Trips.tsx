
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { TripCard } from '@/components/TripCard';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PlusCircle, Briefcase, TrendingUp, Clock, CalendarDays, LoaderCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Trip {
  id: string;
  title: string;
  destination: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status: 'draft' | 'planned' | 'active' | 'completed' | 'cancelled';
  budget?: number;
  currency?: string;
  image_url?: string;
  created_at: string;
  user_id: string;
  path_id?: string;
  path_type?: 'none' | 'manual' | 'ai_generated' | 'existing';
  path_metadata?: any;
}

// Helper function to determine if a trip is upcoming
const isUpcomingTrip = (trip: Trip): boolean => {
  if (!trip.start_date) return false;
  const today = new Date();
  const startDate = new Date(trip.start_date);
  return startDate > today && trip.status !== 'cancelled';
};

// Helper function to determine if a trip is past
const isPastTrip = (trip: Trip): boolean => {
  if (!trip.end_date) return false;
  const today = new Date();
  const endDate = new Date(trip.end_date);
  return endDate < today || trip.status === 'completed';
};

// Helper function to determine if a trip is a draft
const isDraftTrip = (trip: Trip): boolean => {
  return trip.status === 'draft';
};

const Trips = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([]);
  const [pastTrips, setPastTrips] = useState<Trip[]>([]);
  const [draftTrips, setDraftTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchTrips = async () => {
      if (!user) {
        setTrips([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('trips')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        if (data) {
          // Convert data to Trip[] with proper status typing
          const typedTrips: Trip[] = data.map(trip => ({
            ...trip,
            status: trip.status as 'draft' | 'planned' | 'active' | 'completed' | 'cancelled'
          }));
          
          setTrips(typedTrips);
          setUpcomingTrips(typedTrips.filter(isUpcomingTrip));
          setPastTrips(typedTrips.filter(isPastTrip));
          setDraftTrips(typedTrips.filter(isDraftTrip));
        }
      } catch (error) {
        console.error('Error fetching trips:', error);
        toast({
          title: 'Error loading trips',
          description: 'Please try again later',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrips();
  }, [user, toast]);

  const renderLoading = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
      ))}
    </div>
  );

  // Delete a trip by its ID
  const handleDeleteTrip = async (tripId: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId);

      if (error) throw error;
      toast({
        title: "Trip deleted",
        description: "The trip has been deleted successfully.",
      });
      // Filter out the deleted trip and refresh categories
      setTrips(prev => {
        const filtered = prev.filter(trip => trip.id !== tripId);
        setUpcomingTrips(filtered.filter(isUpcomingTrip));
        setPastTrips(filtered.filter(isPastTrip));
        setDraftTrips(filtered.filter(isDraftTrip));
        return filtered;
      });
    } catch (err) {
      console.error('Error deleting trip:', err);
      toast({
        title: "Error deleting trip",
        description: "An error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostTrip = async (trip: Trip) => {
    if (!user) return;
    try {
      const postContent = `Just planned a new trip to ${trip.destination}! Who wants to join?`;

      const { data: post, error } = await supabase.from('posts').insert({
          content: postContent,
          user_id: user.id,
          trip_id: trip.id,
          image_urls: trip.image_url ? [trip.image_url] : [],
          location: trip.destination,
      }).select().single();

      if (error) throw error;
      
      toast({
          title: 'Trip Posted!',
          description: 'Your trip has been posted to the feed.',
      });
    } catch (err) {
      console.error("Error posting trip:", err);
      toast({
          title: 'Error',
          description: 'Could not post trip to feed.',
          variant: 'destructive',
      });
    }
  };

  const handleSharePath = async (trip: Trip) => {
    toast({
      title: "Path Shared!",
      description: `Travel path for "${trip.title}" has been shared to your feed.`,
    });
  };

  // Modified renderTrips to add owner check and delete button
  const renderTrips = (tripsToRender: Trip[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {tripsToRender.map((trip) => (
        <TripCard
          key={trip.id}
          trip={trip}
          showEdit={!!user && trip.user_id === user.id}
          showDelete={!!user && trip.user_id === user.id}
          onDelete={handleDeleteTrip}
          showPost={!!user && trip.user_id === user.id && trip.status !== 'draft'}
          onPost={handlePostTrip}
          showSharePath={!!user && trip.user_id === user.id && trip.path_id}
          onSharePath={handleSharePath}
        />
      ))}
    </div>
  );
  
  return (
    <div className="container px-4 py-6 pb-28">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Your Trips</h1>
          <p className="text-muted-foreground">Manage and organize your travel plans</p>
        </div>
        <Button onClick={() => navigate('/trips/new')}>
          <PlusCircle className="h-4 w-4 mr-2" />
          New Trip
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="animate-fade-in">
          {isLoading ? (
            renderLoading()
          ) : trips.length > 0 ? (
            renderTrips(trips)
          ) : (
            <div className="text-center py-12 space-y-3">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/60" />
              <h3 className="font-medium text-lg">No trips created yet</h3>
              <p className="text-muted-foreground">Create your first trip to start planning your adventure</p>
              <Button onClick={() => navigate('/trips/new')} className="mt-2">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Trip
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="animate-fade-in">
          {isLoading ? (
            renderLoading()
          ) : upcomingTrips.length > 0 ? (
            renderTrips(upcomingTrips)
          ) : (
            <div className="text-center py-12 space-y-3">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/60" />
              <h3 className="font-medium text-lg">No upcoming trips</h3>
              <p className="text-muted-foreground">Plan your next adventure</p>
              <Button onClick={() => navigate('/trips/new')} className="mt-2">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Trip
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="animate-fade-in">
          {isLoading ? (
            renderLoading()
          ) : pastTrips.length > 0 ? (
            renderTrips(pastTrips)
          ) : (
            <div className="text-center py-12 space-y-3">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground/60" />
              <h3 className="font-medium text-lg">No past trips</h3>
              <p className="text-muted-foreground">Your completed trips will appear here</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="draft" className="animate-fade-in">
          {isLoading ? (
            renderLoading()
          ) : draftTrips.length > 0 ? (
            renderTrips(draftTrips)
          ) : (
            <div className="text-center py-12 space-y-3">
              <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/60" />
              <h3 className="font-medium text-lg">No draft trips</h3>
              <p className="text-muted-foreground">Save trips as drafts while planning</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Trips;
