import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { TripForm, TripFormData } from '@/components/TripForm';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { uploadFile } from '@/utils/storage';
import { GroupChatService } from '@/services/GroupChatService';
import { UserProfile } from '@/hooks/useUserSearch';

const NewTrip = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleBack = () => {
    navigate('/trips');
  };
  
  const handleSubmit = async (data: TripFormData) => {
    setIsSubmitting(true);
    let newTripId: string | null = null;
    try {
      // Get the current user ID (with debug logging)
      const { data: userResult, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("Auth error: ", userError);
        toast({
          title: "Error",
          description: "Authentication problem. Please sign in again.",
          variant: "destructive",
        });
        return;
      }
      const userId = userResult.user?.id;
      if (!userId) {
        console.error("User ID not found!");
        toast({
          title: "Error",
          description: "User not found or not logged in.",
          variant: "destructive",
        });
        return;
      }

      // Handle path creation if needed
      let pathId: string | null = null;
      let pathType = data.pathSelection?.type || 'none';
      let pathMetadata = data.pathSelection?.metadata || {};

      if (data.pathSelection?.type === 'existing' && data.pathSelection.path) {
        // Use existing path
        pathId = data.pathSelection.path.id;
        pathMetadata = { sourcePathId: data.pathSelection.path.id };
      } else if ((data.pathSelection?.type === 'manual' || data.pathSelection?.type === 'ai_generated') && data.pathSelection.waypoints?.length) {
        // Create new path from manual or AI-generated waypoints
        const pathData = {
          title: `${data.title} - Travel Path`,
          description: `Custom travel path for ${data.destination}`,
          created_by: userId,
          is_public: false, // Private by default for trip-created paths
          estimated_duration: `${Math.ceil((data.endDate?.getTime() || 0) - (data.startDate?.getTime() || 0)) / (1000 * 60 * 60 * 24)} days`
        };

        const { data: newPath, error: pathError } = await supabase
          .from('travel_paths')
          .insert(pathData)
          .select()
          .single();

        if (pathError) {
          console.error('Error creating path:', pathError);
          toast({
            title: 'Warning',
            description: 'Trip created but path could not be saved',
            variant: 'destructive'
          });
        } else if (newPath) {
          pathId = newPath.id;

          // Create waypoints
          const waypoints = data.pathSelection.waypoints.map((stop, index) => ({
            path_id: newPath.id,
            title: stop.name,
            description: stop.description,
            order_index: index + 1,
            estimated_time: stop.estimated_time,
            latitude: stop.latitude,
            longitude: stop.longitude
          }));

          const { error: waypointsError } = await supabase
            .from('path_waypoints')
            .insert(waypoints);

          if (waypointsError) {
            console.error('Error creating waypoints:', waypointsError);
          }
        }
      }

      let imageUrl: string | null = null;
      if (data.imageFile) {
        const { url, error } = await uploadFile(data.imageFile, {
          bucket: 'trip-images',
          folder: 'public',
          userId: userId,
        });

        if (error) {
          toast({
            title: 'Image Upload Failed',
            description: error.message,
            variant: 'destructive',
          });
          setIsSubmitting(false);
          return;
        }
        imageUrl = url;
      }

      // Check and log all required fields
      const payload = {
        title: data.title,
        destination: data.destination,
        description: data.description,
        start_date: data.startDate?.toISOString().split('T')[0],
        end_date: data.endDate?.toISOString().split('T')[0],
        budget: data.budget ? parseFloat(data.budget) : null,
        currency: data.currency,
        max_participants: data.maxParticipants,
        user_id: userId,
        image_url: imageUrl,
        path_id: pathId // Link the created/selected path
      };
      console.log("Trip insert payload:", payload);

      // Check for missing required fields
      for (const key of ["title", "destination", "start_date", "end_date", "user_id"]) {
        if (!payload[key]) {
          console.error(`Required field ${key} is missing or empty:`, payload[key]);
        }
      }

      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .insert(payload)
        .select()
        .single();

      if (tripError) {
        console.error("Trip creation error (as string):", JSON.stringify(tripError));
        console.error("Trip creation error (object):", tripError);
        toast({
          title: "Error",
          description: tripError.message || "Failed to create trip. Please try again.",
          variant: "destructive",
        });
        return;
      }
      if (!trip) {
        console.error("Trip insert returned no data!");
        toast({
          title: "Error",
          description: "Failed to create trip: No data returned.",
          variant: "destructive",
        });
        return;
      }
      newTripId = trip.id;

      toast({
        title: "Trip Created!",
        description: "Your new trip has been created successfully.",
      });

      // Create group chat if requested
      if (data.createGroupChat && data.companions.length > 0) {
        try {
          await GroupChatService.createGroupChat({
            name: `${data.title} Trip Chat`,
            description: `Group chat for the trip to ${data.destination}`,
            createdBy: userId,
            participantIds: data.companions.map(c => c.id),
          });

          toast({
            title: "Group Chat Created",
            description: "A group chat has been created for your trip.",
          });
        } catch (groupChatError) {
          console.error("Error creating group chat for trip:", groupChatError);
          toast({
            title: "Group Chat Error",
            description: "Failed to create group chat for the trip.",
            variant: "destructive",
          });
        }
      }

      // Add companions as participants (creator is auto-added by trigger)
      if (data.companions.length > 0) {
        const participantInserts = data.companions.map(companion => ({
          trip_id: trip.id,
          user_id: companion.id, 
          role: 'participant',
          status: 'accepted',
        }));
        
        const { error: participantsError } = await supabase
          .from('trip_participants')
          .upsert(participantInserts, { 
            onConflict: 'trip_id,user_id',
            ignoreDuplicates: false 
          });
        
        if (participantsError) {
          console.error("Error adding companions:", participantsError);
          toast({
            title: "Companion Add Error",
            description: "Could not add one or more companions.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Companions added",
            description: `${data.companions.length} companions have been added to your trip.`,
          });
        }
      }
      
      // Navigate to the trips page
      navigate('/trips', { state: { newTrip: trip } });
    } catch (error) {
      console.error("Error creating trip (main catch):", error);
      toast({
        title: "Error",
        description: "Failed to create trip (exception). Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className={`px-5 pb-2 ${isMobile ? 'pt-1' : 'pt-5'}`}>
        <h1 className={`font-heading font-semibold ${isMobile ? 'text-xl' : 'text-2xl'}`}>
          Create New Trip
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Fill in the details to plan your adventure
        </p>
      </div>
      <div className={`flex-1 overflow-y-auto px-5 pt-3 pb-28`}>
        <div className="max-w-2xl mx-auto">
          <TripForm 
            onSubmit={handleSubmit}
            submitButtonText="Create Trip"
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default NewTrip;
