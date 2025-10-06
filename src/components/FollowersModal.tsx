
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, User, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Follower {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  follower: {
    id: string;
    username: string;
    first_name?: string;
    last_name?: string;
    profile_image_url?: string;
  };
}

interface FollowersModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function FollowersModal({ userId, isOpen, onClose }: FollowersModalProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [allFollowers, setAllFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen && userId) {
      fetchFollowers();
    }
  }, [isOpen, userId]);

  const fetchFollowers = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          *,
          follower:users!follower_id(id, username, first_name, last_name, profile_image_url)
        `)
        .eq('following_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setFollowers(data || []);
      setAllFollowers(data || []);
      
    } catch (error) {
      console.error('Error fetching followers:', error);
      toast({
        title: "Error",
        description: "Failed to load followers",
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

  const filteredFollowers = searchQuery
    ? allFollowers.filter(follow => {
        const username = formatUsername(follow.follower).toLowerCase();
        return username.includes(searchQuery.toLowerCase());
      })
    : followers;

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
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Followers</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search followers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
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
          ) : filteredFollowers.length > 0 ? (
            <div className="p-2">
              {filteredFollowers.map(follow => (
                <div 
                  key={follow.id} 
                  className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors rounded-md cursor-pointer"
                  onClick={() => handleUserClick(follow.follower.id)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={follow.follower.profile_image_url} />
                      <AvatarFallback className="text-sm">
                        {getInitials(follow.follower)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">
                        {formatUsername(follow.follower)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        @{follow.follower.username || 'user'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <User className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-center">
                {searchQuery ? 'No followers found' : 'No followers yet'}
              </p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
