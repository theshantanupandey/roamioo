import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

type JoinRequestUser = {
  id: string;
  username: string;
  first_name?: string | null;
  profile_image_url?: string | null;
};

type JoinRequest = {
  id: string;
  user_id: string;
  message?: string | null;
  created_at: string;
  status: string;
  users?: JoinRequestUser;
};

interface TripJoinRequestsProps {
  tripId: string;
  onParticipantChange: () => void;
}

function useTripCreator(tripId: string) {
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    async function fetchCreator() {
      // Get current user id from localStorage/session/Supabase auth if set up
      const session = supabase.auth.getSession ? await supabase.auth.getSession() : null;
      const userId = session?.data?.session?.user?.id;
      if (!userId || !tripId) {
        setIsCreator(false);
        return;
      }
      // Fetch trip to check creator
      const { data: trip } = await supabase.from("trips").select("user_id").eq("id", tripId).maybeSingle();
      setIsCreator(trip?.user_id === userId);
    }
    fetchCreator();
  }, [tripId]);

  return isCreator;
}

export const TripJoinRequests: React.FC<TripJoinRequestsProps> = ({ tripId, onParticipantChange }) => {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const isCreator = useTripCreator(tripId);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchJoinRequests();
    // eslint-disable-next-line
  }, [tripId]);

  async function fetchJoinRequests() {
    setLoading(true);
    try {
      const { data: requestsData, error: requestsError } = await supabase
        .from("trip_join_requests")
        .select("*")
        .eq("trip_id", tripId)
        .order("created_at", { ascending: false });

      if (requestsError) throw requestsError;

      if (requestsData && requestsData.length > 0) {
        const userIds = requestsData.map(req => req.user_id);
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, username, first_name, profile_image_url")
          .in("id", userIds);
        if (usersError) throw usersError;
        
        const requestsWithUsers = requestsData.map(request => ({
          ...request,
          users: usersData?.find(user => user.id === request.user_id)
        }));
        setRequests(requestsWithUsers);
      } else {
        setRequests([]);
      }
    } catch (err) {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, action: "approved" | "rejected" | "removed", user_id?: string) {
    setProcessingId(id);

    try {
      if (action === "removed" && user_id) {
        console.log("Attempting to remove participant:", { tripId, user_id, requestId: id });
        
        // Step 1: Remove from trip_participants table using direct RPC call
        const { error: participantError } = await supabase.rpc('remove_trip_participant', {
          p_trip_id: tripId,
          p_user_id: user_id
        });

        if (participantError) {
          console.error("Error removing participant:", participantError);
          // Fallback: try direct delete
          const { error: directDeleteError } = await supabase
            .from("trip_participants")
            .delete()
            .eq("trip_id", tripId)
            .eq("user_id", user_id);
            
          if (directDeleteError) {
            console.error("Direct delete also failed:", directDeleteError);
            throw directDeleteError;
          }
        }
        
        // Step 2: Update the join request status to 'rejected'
        const { error: requestError } = await supabase
          .from("trip_join_requests")
          .update({ status: 'rejected' })
          .eq("id", id);
          
        if (requestError) {
          console.error("Error updating request status:", requestError);
          // Don't throw here as the main action (removal) succeeded
        }

        toast({
          title: "Participant removed",
          description: "They no longer have access to the trip.",
        });
        
        fetchJoinRequests();
        onParticipantChange();
        setProcessingId(null);
        return;
      }
      
      // Handle approve/reject actions
      const { error } = await supabase
        .from("trip_join_requests")
        .update({ status: action })
        .eq("id", id);

      if (error) throw error;

      if (action === "approved") {
        const req = requests.find(r => r.id === id);
        if (req) {
          // Add to trip participants
          const { error: participantError } = await supabase
            .from("trip_participants")
            .insert({
              trip_id: tripId,
              user_id: req.user_id,
              status: "accepted",
              role: "participant"
            });

          if (participantError) {
            console.error("Error adding participant:", participantError);
            throw participantError;
          }

          // Create notification for the new participant
          await supabase.from("activities").insert({
            user_id: req.user_id,
            actor_id: req.user_id,
            entity_id: tripId,
            entity_type: "trip",
            type: "trip_joined",
            message: "You have joined a new trip!"
          });

          // Notify existing participants
          const { data: oldParticipants } = await supabase
            .from("trip_participants")
            .select("user_id")
            .eq("trip_id", tripId)
            .neq("user_id", req.user_id);

          if (oldParticipants) {
            for (const p of oldParticipants) {
              await supabase.from("activities").insert({
                user_id: p.user_id,
                actor_id: req.user_id,
                entity_id: tripId,
                entity_type: "trip",
                type: "participant_joined",
                message: `${req.users?.first_name || req.users?.username || 'A user'} joined your trip!`
              });
            }
          }

          onParticipantChange();
        }
      }

      toast({
        title: action === "approved" ? "Request Approved" : "Request Rejected",
        description: `The join request was ${action === "approved" ? "approved" : "rejected"}.`,
      });
      
      fetchJoinRequests();
    } catch (error) {
      console.error(`Error handling action '${action}':`, error);
      toast({
        title: "Error",
        description: "Failed to update the request.",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    );
  }

  if (!requests.length) {
    return (
      <Card className="p-4 text-center text-muted-foreground border-border bg-card">
        No join requests yet
      </Card>
    );
  }

  // Updated styling for dark theme compliance
  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card
          key={request.id}
          className="flex items-center gap-3 p-4 shadow-sm bg-card border-border rounded-2xl"
        >
          <Avatar className="h-12 w-12">
            <AvatarImage src={request.users?.profile_image_url || ""} alt={request.users?.username || ""} />
            <AvatarFallback className="bg-muted text-muted-foreground">
              {(request.users?.first_name?.charAt(0) || request.users?.username?.charAt(0) || "?").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-medium line-clamp-1 text-card-foreground">
              {request.users?.first_name || request.users?.username}
            </div>
            <div className="text-xs text-muted-foreground line-clamp-1">
              @{request.users?.username}
            </div>
            {request.message && (
              <div className="text-sm mt-1 text-muted-foreground italic">{request.message}</div>
            )}
            <div className="mt-1 flex gap-2 items-center">
              <span className={
                request.status === "pending"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
                  : request.status === "approved"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
              + " text-xs rounded-full px-2 py-1"}>
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </span>
            </div>
          </div>
          {/* Actions for creator (pending = approve/reject, approved = remove) */}
          {isCreator && (
            request.status === "pending" ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-green-500 hover:bg-green-600 text-white dark:bg-green-600 dark:hover:bg-green-700"
                  disabled={processingId === request.id}
                  onClick={() => handleAction(request.id, "approved")}
                >
                  Approve
                </Button>
                <Button 
                  size="sm"
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" 
                  disabled={processingId === request.id}
                  onClick={() => handleAction(request.id, "rejected")}
                >
                  Reject
                </Button>
              </div>
            ) : request.status === "approved" ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  disabled={processingId === request.id}
                  onClick={() => handleAction(request.id, "removed", request.user_id)}
                >
                  Remove
                </Button>
              </div>
            ) : null
          )}
        </Card>
      ))}
    </div>
  );
};
