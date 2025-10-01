
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Route, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PathFollowButtonProps {
  pathId: string;
  isFollowing?: boolean;
  onFollowChange?: (following: boolean) => void;
}

export const PathFollowButton: React.FC<PathFollowButtonProps> = ({
  pathId,
  isFollowing = false,
  onFollowChange
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState(isFollowing);

  const handleToggleFollow = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to follow paths.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      if (following) {
        // Unfollow path
        const { error } = await supabase
          .from('user_followed_paths')
          .delete()
          .eq('path_id', pathId)
          .eq('user_id', user.id);

        if (error) throw error;

        setFollowing(false);
        onFollowChange?.(false);
        toast({
          title: "Path unfollowed",
          description: "Removed from your saved paths"
        });
      } else {
        // Follow path
        const { error } = await supabase
          .from('user_followed_paths')
          .insert({
            path_id: pathId,
            user_id: user.id,
            status: 'following'
          });

        if (error) throw error;

        setFollowing(true);
        onFollowChange?.(true);
        toast({
          title: "Path followed!",
          description: "Added to your saved paths"
        });
      }
    } catch (error: any) {
      console.error('Error toggling path follow:', error);
      toast({
        title: "Error",
        description: "Failed to update path status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleToggleFollow}
      disabled={loading}
      className={`w-full ${following 
        ? 'bg-muted hover:bg-muted/80 text-foreground' 
        : 'bg-[#e2fa3e] hover:bg-[#d5ec35] text-black'
      }`}
      variant={following ? "outline" : "default"}
    >
      {following ? (
        <Check className="h-4 w-4 mr-2" />
      ) : (
        <Route className="h-4 w-4 mr-2" />
      )}
      {loading ? "..." : following ? "Following" : "Follow Path"}
    </Button>
  );
};
