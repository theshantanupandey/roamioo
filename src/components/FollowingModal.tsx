
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Following {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  following: {
    id: string;
    username: string;
    first_name?: string;
    last_name?: string;
    profile_image_url?: string;
  };
}

interface FollowingModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function FollowingModal({ userId, isOpen, onClose }: FollowingModalProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [following, setFollowing] = useState<Following[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && userId) {
      fetchFollowing();
    }
  }, [isOpen, userId]);

  const fetchFollowing = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          *,
          following:users!following_id(id, username, first_name, last_name, profile_image_url)
        `)
        .eq('follower_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setFollowing(data || []);
      
    } catch (error) {
      console.error('Error fetching following:', error);
      toast({
        title: "Error",
        description: "Failed to load following",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatUsername = (user: any) => {
    if (!user) return 'Unknown User';
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username || 'Unknown User';
  };

  const getInitials = (user: any) => {
    if (!user) return 'UU';
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user.username?.substring(0, 2).toUpperCase() || 'UU';
  };

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-background rounded-lg w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Following</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="h-96">
          {loading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center space-x-3 animate-pulse">
                  <div className="h-12 w-12 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : following.length > 0 ? (
            <div className="p-2">
              {following.map(follow => (
                <div 
                  key={follow.id} 
                  className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors rounded-md cursor-pointer"
                  onClick={() => handleUserClick(follow.following.id)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={follow.following.profile_image_url} />
                      <AvatarFallback className="text-sm">
                        {getInitials(follow.following)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">
                        {formatUsername(follow.following)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        @{follow.following.username || 'user'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <User className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-center">Not following anyone yet</p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
