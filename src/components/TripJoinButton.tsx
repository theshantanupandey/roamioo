
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Users, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TripJoinButtonProps {
  tripId: string;
  spotsAvailable?: number;
  isOwner?: boolean;
  hasRequested?: boolean;
  isParticipant?: boolean;
}

export const TripJoinButton: React.FC<TripJoinButtonProps> = ({
  tripId,
  spotsAvailable = 0,
  isOwner = false,
  hasRequested = false,
  isParticipant = false
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(hasRequested);
  const [joined, setJoined] = useState(isParticipant);
  const [requestId, setRequestId] = useState<string | null>(null);

  // Fetch join request on mount, if any
  useEffect(() => {
    if (!user || isOwner) return;

    const fetchRequest = async () => {
      const { data, error } = await supabase
        .from('trip_join_requests')
        .select('id,status')
        .eq('trip_id', tripId)
        .eq('user_id', user.id)
        .single();

      if (data) {
        setRequestSent(data.status === 'pending');
        setRequestId(data.id);
      } else {
        setRequestSent(false);
        setRequestId(null);
      }
    };

    fetchRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, tripId, isOwner]);

  const handleJoinRequest = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to join trips.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error, data } = await supabase
        .from('trip_join_requests')
        .insert({
          trip_id: tripId,
          user_id: user.id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      setRequestSent(true);
      setRequestId(data.id);
      toast({
        title: "Request sent!",
        description: "Your request to join this trip has been sent to the organizer."
      });
    } catch (error: any) {
      console.error('Error sending join request:', error);
      toast({
        title: "Error",
        description: "Failed to send join request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Withdraw join request
  const handleWithdrawRequest = async () => {
    if (!user || !requestId) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('trip_join_requests')
        .delete()
        .eq('id', requestId)
        .eq('user_id', user.id)
        .eq('trip_id', tripId);

      if (error) throw error;

      setRequestSent(false);
      setRequestId(null);
      toast({
        title: "Request withdrawn",
        description: "Your request to join this trip has been withdrawn."
      });
    } catch (error: any) {
      console.error('Error withdrawing join request:', error);
      toast({
        title: "Error",
        description: "Failed to withdraw join request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (isOwner) {
    return (
      <Button variant="outline" disabled className="w-full">
        <Users className="h-4 w-4 mr-2" />
        Your Trip
      </Button>
    );
  }

  if (joined) {
    return (
      <Button variant="outline" disabled className="w-full">
        <Check className="h-4 w-4 mr-2" />
        Joined
      </Button>
    );
  }

  if (requestSent) {
    return (
      <div className="flex flex-col gap-2 w-full">
        <Button variant="outline" disabled className="w-full">
          <Users className="h-4 w-4 mr-2" />
          Request Sent
        </Button>
        <Button 
          variant="ghost"
          disabled={loading}
          className="w-full text-red-500"
          onClick={handleWithdrawRequest}
        >
          Withdraw Request
        </Button>
      </div>
    );
  }

  if (spotsAvailable <= 0) {
    return (
      <Button variant="outline" disabled className="w-full">
        <Users className="h-4 w-4 mr-2" />
        Trip Full
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleJoinRequest}
      disabled={loading}
      className="w-full bg-[#e2fa3e] hover:bg-[#d5ec35] text-black"
    >
      <Users className="h-4 w-4 mr-2" />
      {loading ? "Sending..." : `Join Trip (${spotsAvailable} spots left)`}
    </Button>
  );
};
