import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Clock, 
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { TripJoinRequests } from "@/components/TripJoinRequests";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TripForm, TripFormData } from '@/components/TripForm';
import { useToast } from '@/hooks/use-toast';
import { uploadFile, getFilePathFromUrl, deleteFile } from '@/utils/storage';

const getStatusBadgeClasses = (status: string) => {
    switch (status) {
        case 'planned': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-300/50';
        case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-300/50 animate-pulse';
        case 'completed': return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-400/50';
        case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 border-red-300/50';
        case 'draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200 border-yellow-300/50';
        default: return 'bg-secondary text-secondary-foreground border-border';
    }
};

const TripDetails = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const searchParams = new URLSearchParams(location.search);
  const isEditMode = searchParams.get('edit') === 'true';

  const [trip, setTrip] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUserId(session.user.id);
      }
    };
    fetchUser();
  }, []);

  const fetchTripDetails = useCallback(async () => {
    if (!id) return;
    // Don't set loading to true on refetch, to avoid UI flashing
    // setLoading(true); 
    setNotFound(false);

    const { data: tripData, error: tripErr } = await supabase
      .from("trips")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (tripErr || !tripData) {
      setTrip(null);
      setNotFound(true);
      setLoading(false);
      return;
    }
    setTrip(tripData);

    const { data: participantRows } = await supabase
      .from("trip_participants")
      .select("user_id, role, status, users: user_id (id, username, first_name, last_name, profile_image_url)")
      .eq("trip_id", id);

    const formattedParticipants = (participantRows || []).map((p: any) => ({
      id: p.users?.id || p.user_id,
      name: p.users?.first_name && p.users?.last_name
        ? `${p.users.first_name} ${p.users.last_name}`
        : p.users?.username,
      avatar: p.users?.profile_image_url || "",
      role: p.role,
      status: p.status,
      email: undefined,
    }));
    setParticipants(formattedParticipants);

    setLoading(false);
  }, [id]);

  useEffect(() => {
    setLoading(true);
    fetchTripDetails();
  }, [fetchTripDetails]);

  const handleUpdateTrip = async (data: TripFormData) => {
    if (!trip) return;
    setIsSubmitting(true);

    try {
        let imageUrl = trip.image_url;

        // If a new file is uploaded
        if (data.imageFile) {
            const { url, error: uploadError } = await uploadFile(data.imageFile, {
                bucket: 'trip-images',
                folder: 'public',
                userId: trip.user_id,
            });
            if (uploadError) throw uploadError;
            imageUrl = url;

            // If there was an old image, delete it
            if (trip.image_url) {
                const oldFilePath = getFilePathFromUrl(trip.image_url, 'trip-images');
                if (oldFilePath) {
                    await deleteFile('trip-images', oldFilePath);
                }
            }
        } else if (!data.imageUrl && trip.image_url) {
            // Image was removed without a new one being uploaded
            const oldFilePath = getFilePathFromUrl(trip.image_url, 'trip-images');
            if (oldFilePath) {
                await deleteFile('trip-images', oldFilePath);
            }
            imageUrl = null;
        }

        const payload = {
            title: data.title,
            destination: data.destination,
            description: data.description,
            start_date: data.startDate?.toISOString().split('T')[0],
            end_date: data.endDate?.toISOString().split('T')[0],
            budget: data.budget ? parseFloat(data.budget) : null,
            currency: data.currency,
            max_participants: data.maxParticipants,
            image_url: imageUrl,
        };

        const { error } = await supabase.from('trips').update(payload).eq('id', trip.id);
        if (error) throw error;
        
        toast({ title: 'Trip Updated', description: 'Your trip has been updated successfully.' });
        navigate(`/trips/${trip.id}`);
        fetchTripDetails(); // Refetch details to show updated data
    } catch (error: any) {
        toast({ title: 'Error', description: error.message || 'Failed to update trip.', variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  };


  if (loading) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Skeleton className="w-28 h-28 rounded-full" />
              <div className="flex-1 space-y-3 w-full">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="py-4">
              <CardContent className="p-0 flex flex-col items-center justify-center">
                <Skeleton className="h-8 w-8 mx-auto mb-2 rounded-lg" />
                <Skeleton className="h-4 w-16 mx-auto" />
                <Skeleton className="h-5 w-20 mx-auto mt-1" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (isEditMode) {
    if (loading) {
      return (
        <div className="container max-w-2xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-1/4 mb-4" />
          <div className="space-y-6">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        </div>
      );
    }
    if (notFound || !trip) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-2">Trip Not Found</h2>
          <p className="text-muted-foreground mb-4">Cannot edit a trip that does not exist.</p>
          <Button asChild>
            <Link to="/trips">Back to Trips</Link>
          </Button>
        </div>
      );
    }
    
    return (
        <div className="container max-w-2xl mx-auto px-4 py-8 animate-fade-in">
            <h1 className="text-3xl font-bold mb-6">Edit Trip</h1>
            <TripForm
                initialData={{
                    ...trip,
                    startDate: trip.start_date ? new Date(trip.start_date) : undefined,
                    endDate: trip.end_date ? new Date(trip.end_date) : undefined,
                    budget: trip.budget?.toString() || '',
                    imageUrl: trip.image_url
                }}
                onSubmit={handleUpdateTrip}
                submitButtonText="Save Changes"
                isSubmitting={isSubmitting}
            />
        </div>
    );
  }

  if (notFound || !trip) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">Trip Not Found</h2>
        <p className="text-muted-foreground mb-4">The trip you are looking for does not exist or has been moved.</p>
        <Button asChild>
          <Link to="/trips">Back to Trips</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Card className="overflow-hidden">
        <div className="h-40 bg-muted overflow-hidden">
          <img src={trip.image_url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop'} alt={trip.destination} className="w-full h-full object-cover" />
        </div>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="flex-1">
              <Badge variant="outline" className={cn("capitalize mb-2", getStatusBadgeClasses(trip.status))}>
                {trip.status}
              </Badge>
              <h1 className="text-3xl font-heading font-bold text-foreground mb-1">{trip.title}</h1>
              <div className="flex items-center gap-2 text-muted-foreground justify-center md:justify-start">
                <MapPin className="w-5 h-5" />
                <span className="font-medium">{trip.destination}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <CardContent className="p-4 flex flex-col justify-center items-center h-full">
            <Calendar className="w-7 h-7 mb-2 text-primary" />
            <p className="text-sm font-medium">Dates</p>
            <p className="text-xs text-muted-foreground">
              {trip.start_date ? new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "N/A"} - {trip.end_date ? new Date(trip.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}
            </p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4 flex flex-col justify-center items-center h-full">
            <Clock className="w-7 h-7 mb-2 text-primary" />
            <p className="text-sm font-medium">Duration</p>
            <p className="text-lg font-semibold">{trip.start_date && trip.end_date ? `${Math.ceil((new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / (1000 * 60 * 60 * 24))} days` : "N/A"}</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4 flex flex-col justify-center items-center h-full">
            <DollarSign className="w-7 h-7 mb-2 text-primary" />
            <p className="text-sm font-medium">Budget</p>
            <p className="text-lg font-semibold">{trip.budget ? `${trip.currency || "USD"} ${Number(trip.budget).toLocaleString()}` : "N/A"}</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4 flex flex-col justify-center items-center h-full">
            <Users className="w-7 h-7 mb-2 text-primary" />
            <p className="text-sm font-medium">Participants</p>
            <p className="text-lg font-semibold">{participants.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-xl">About This Trip</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{trip.description || "No description provided."}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-xl">Participants</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {participants.map((p) => (
              <div key={p.id} className="flex flex-col items-center text-center w-24">
                <Avatar className="w-12 h-12 mb-2">
                  <AvatarImage src={p.avatar} alt={p.name} />
                  <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                    {p.name?.substring(0, 2).toUpperCase() ?? "??"}
                  </AvatarFallback>
                </Avatar>
                <p className="font-medium text-sm truncate w-full">{p.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {p.role === "organizer" || p.id === trip.user_id ? "Organizer" : "Participant"}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {currentUserId && currentUserId === trip.user_id && (
        <Card>
          <CardHeader><CardTitle className="text-xl">Join Requests</CardTitle></CardHeader>
          <CardContent>
            <TripJoinRequests tripId={trip.id} onParticipantChange={fetchTripDetails} />
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3 mt-4">
        <Button variant="outline" asChild>
          <Link to="/trips">Back to Trips</Link>
        </Button>
        <Button>
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </div>
    </div>
  );
};

export default TripDetails;
