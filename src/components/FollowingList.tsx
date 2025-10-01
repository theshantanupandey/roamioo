import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { X, Search, UserPlus, UserMinus } from 'lucide-react';

interface Following {
  id: string;
  following_id: string;
  user: {
    id: string;
    username: string;
    first_name?: string;
    last_name?: string;
    profile_image_url?: string;
  };
}

interface SuggestedUser {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
  isFollowing: boolean;
}

interface FollowingListProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export const FollowingList = ({ isOpen, onClose, userId }: FollowingListProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [following, setFollowing] = useState<Following[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'following' | 'suggestions'>('following');

  useEffect(() => {
    if (isOpen && userId) {
      fetchFollowing();
      fetchSuggestedUsers();
    }
  }, [isOpen, userId]);

  const fetchFollowing = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          id,
          following_id,
          following_user:users!user_follows_following_id_fkey (id, username, first_name, last_name, profile_image_url)
        `)
        .eq('follower_id', userId);

      if (error) throw error;

      setFollowing(data?.map(item => ({
        id: item.id,
        following_id: item.following_id,
        user: item.following_user
      })) || []);
    } catch (error) {
      console.error('Error fetching following:', error);
      toast({
        title: "Error",
        description: "Failed to load following list",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestedUsers = async () => {
    try {
      // Get users that the current user is not following
      const { data: allUsers, error } = await supabase
        .from('users')
        .select('id, username, first_name, last_name, profile_image_url')
        .neq('id', userId)
        .limit(10);

      if (error) throw error;

      // Get current following list to filter out
      const { data: currentFollowing } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', userId);

      const followingIds = currentFollowing?.map(f => f.following_id) || [];
      
      // Get users that are already being followed by the current user (not the profile owner)
      let userFollowingIds: string[] = [];
      if (user?.id && user.id !== userId) {
        const { data: userFollowing } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id);
        
        userFollowingIds = userFollowing?.map(f => f.following_id) || [];
      }
      
      const suggested = allUsers?.filter(userData => !followingIds.includes(userData.id))
        .map(userData => ({ 
          ...userData, 
          isFollowing: userFollowingIds.includes(userData.id) 
        })) || [];

      setSuggestedUsers(suggested);
    } catch (error) {
      console.error('Error fetching suggested users:', error);
    }
  };

  const handleFollow = async (targetUserId: string, username: string) => {
    try {
      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: user?.id,
          following_id: targetUserId
        });

      if (error) throw error;

      // Update suggested users list
      setSuggestedUsers(prev => 
        prev.map(u => u.id === targetUserId ? { ...u, isFollowing: true } : u)
      );

      toast({
        title: "Following",
        description: `You are now following ${username}`
      });
    } catch (error) {
      console.error('Error following user:', error);
      toast({
        title: "Error",
        description: "Failed to follow user",
        variant: "destructive"
      });
    }
  };

  const handleUnfollow = async (followId: string, targetUserId: string, username: string) => {
    try {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('id', followId);

      if (error) throw error;

      setFollowing(following.filter(f => f.id !== followId));
      
      // Update suggested users list if the user is there
      setSuggestedUsers(prev => 
        prev.map(u => u.id === targetUserId ? { ...u, isFollowing: false } : u)
      );
      
      toast({
        title: "Unfollowed",
        description: `You unfollowed ${username}`
      });
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast({
        title: "Error",
        description: "Failed to unfollow user",
        variant: "destructive"
      });
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

  const filteredFollowing = following.filter(follow =>
    formatUsername(follow.user).toLowerCase().includes(searchQuery.toLowerCase()) ||
    follow.user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSuggested = suggestedUsers.filter(user =>
    formatUsername(user).toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  const isOwnProfile = user?.id === userId;

  const handleUserClick = (clickedUserId: string) => {
    navigate(`/profile/${clickedUserId}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background w-full max-w-md h-[80vh] rounded-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Following</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'following'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('following')}
          >
            Following ({following.length})
          </button>
          <button
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'suggestions'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('suggestions')}
          >
            Suggestions
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center text-muted-foreground py-8">Loading...</div>
          ) : activeTab === 'following' ? (
            filteredFollowing.length > 0 ? (
              <div className="space-y-3">
                {filteredFollowing.map(follow => (
                  <div key={follow.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div 
                      className="flex items-center space-x-3 cursor-pointer flex-1"
                      onClick={() => handleUserClick(follow.user.id)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={follow.user.profile_image_url} />
                        <AvatarFallback>{getInitials(follow.user)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{formatUsername(follow.user)}</div>
                        <div className="text-xs text-muted-foreground">@{follow.user.username}</div>
                      </div>
                    </div>
                    
                    {isOwnProfile && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnfollow(follow.id, follow.following_id, follow.user.username);
                        }}
                        className="h-8 px-3"
                      >
                        <UserMinus className="h-3 w-3 mr-1" />
                        Unfollow
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                {searchQuery ? 'No users found' : (isOwnProfile ? "You're not following anyone yet" : "Not following anyone")}
              </div>
            )
          ) : (
            filteredSuggested.length > 0 ? (
              <div className="space-y-3">
                {filteredSuggested.map(suggestedUser => (
                  <div key={suggestedUser.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div 
                      className="flex items-center space-x-3 cursor-pointer flex-1"
                      onClick={() => handleUserClick(suggestedUser.id)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={suggestedUser.profile_image_url} />
                        <AvatarFallback>{getInitials(suggestedUser)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{formatUsername(suggestedUser)}</div>
                        <div className="text-xs text-muted-foreground">@{suggestedUser.username}</div>
                      </div>
                    </div>
                    
                    <Button
                      variant={suggestedUser.isFollowing ? "outline" : "default"}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFollow(suggestedUser.id, suggestedUser.username);
                      }}
                      disabled={suggestedUser.isFollowing}
                      className={`h-8 px-3 ${suggestedUser.isFollowing ? 'text-muted-foreground' : ''}`}
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      {suggestedUser.isFollowing ? 'Following' : 'Follow'}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                {searchQuery ? 'No users found' : 'No suggestions available'}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
