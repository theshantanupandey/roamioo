
import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, User, UserCheck, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ExploreView } from '@/components/ExploreView';

interface UserProfile {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  profile_image_url: string;
  isFollowing: boolean;
}

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [recentSearches, setRecentSearches] = useState<UserProfile[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch suggested users from backend
  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('users')
          .select('id, username, first_name, last_name, profile_image_url')
          .neq('id', user.id) // Exclude current user
          .limit(4);
          
        if (error) throw error;
        
        const usersWithFollowStatus = data?.map(u => ({
          ...u,
          isFollowing: false // We'll check follow status separately if needed
        })) || [];
        
        setSuggestedUsers(usersWithFollowStatus);
      } catch (error) {
        console.error('Error fetching suggested users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestedUsers();
  }, [user]);

  // Search users based on query
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim() || !user) {
        setSearchResults([]);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('users')
          .select('id, username, first_name, last_name, profile_image_url')
          .neq('id', user.id)
          .or(`username.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`)
          .limit(10);
          
        if (error) throw error;
        
        const usersWithFollowStatus = data?.map(u => ({
          ...u,
          isFollowing: false
        })) || [];
        
        setSearchResults(usersWithFollowStatus);
      } catch (error) {
        console.error('Error searching users:', error);
        toast({
          title: "Search error",
          description: "Failed to search users. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, user, toast]);

  const handleFollow = async (targetUser: UserProfile) => {
    if (!user) return;
    
    try {
      if (targetUser.isFollowing) {
        // Unfollow user
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUser.id);
      } else {
        // Follow user
        await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: targetUser.id
          });
      }
      
      // Update local state
      const updateUser = (users: UserProfile[]) =>
        users.map(u => u.id === targetUser.id ? { ...u, isFollowing: !u.isFollowing } : u);
      
      setSuggestedUsers(updateUser);
      setSearchResults(updateUser);
      setRecentSearches(updateUser);
      
      toast({
        title: targetUser.isFollowing ? `Unfollowed ${targetUser.username}` : `Following ${targetUser.username}`,
        description: targetUser.isFollowing ? "You will no longer see their posts in your feed." : "Their posts will now appear in your feed.",
      });
    } catch (error) {
      console.error('Error updating follow status:', error);
      toast({
        title: "Error",
        description: "Failed to update follow status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const addToRecentSearches = (targetUser: UserProfile) => {
    // Check if already in recent searches
    if (!recentSearches.find(u => u.id === targetUser.id)) {
      // Add to recent searches and limit to 5
      setRecentSearches(prev => [targetUser, ...prev].slice(0, 5));
    }
    
    toast({
      title: `Viewing ${targetUser.username}'s profile`,
      description: "User profile page would open here."
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    toast({
      title: "Recent searches cleared",
    });
  };

  const activateSearch = () => {
    setIsSearchActive(true);
  };

  const deactivateSearch = () => {
    setIsSearchActive(false);
    setSearchQuery('');
  };

  return (
    <div className="container pb-28 p-4">
      {/* Search Header */}
      <div className="relative flex items-center mb-6">
        {isSearchActive && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2" 
            onClick={deactivateSearch}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        
        <div className="relative flex-1" onClick={!isSearchActive ? activateSearch : undefined}>
          {isSearchActive ? (
            <Input
              className="pl-9"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          ) : (
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                className="pl-9"
                placeholder="Search"
                readOnly
              />
            </div>
          )}
          
          {isSearchActive && searchQuery && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8" 
              onClick={() => setSearchQuery('')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </Button>
          )}
        </div>
      </div>

      {/* Search Content */}
      {isSearchActive ? (
        <>
          {searchQuery === '' ? (
            <>
              {recentSearches.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="font-medium">Recent</h2>
                    <Button 
                      variant="ghost" 
                      className="text-xs text-blue-600" 
                      onClick={clearRecentSearches}
                    >
                      Clear all
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {recentSearches.map(user => (
                      <UserListItem 
                        key={user.id} 
                        user={user} 
                        onFollow={() => handleFollow(user)} 
                        onClick={() => addToRecentSearches(user)}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="font-medium mb-3">Suggested</h2>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
                        <div className="flex-1 space-y-1">
                          <div className="h-4 bg-muted rounded animate-pulse" />
                          <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : suggestedUsers.length > 0 ? (
                  <div className="space-y-4">
                    {suggestedUsers.map(user => (
                      <UserListItem 
                        key={user.id} 
                        user={user} 
                        onFollow={() => handleFollow(user)} 
                        onClick={() => addToRecentSearches(user)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <User className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No users to suggest yet</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            // Search Results
            <div>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
                      <div className="flex-1 space-y-1">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                        <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-4">
                  {searchResults.map(user => (
                    <UserListItem 
                      key={user.id} 
                      user={user} 
                      onFollow={() => handleFollow(user)} 
                      onClick={() => addToRecentSearches(user)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <User className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No users found matching "{searchQuery}"</p>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        // Explore View - Show popular posts
        <ExploreView />
      )}
    </div>
  );
};

interface UserListItemProps {
  user: UserProfile;
  onFollow: () => void;
  onClick: () => void;
}

const UserListItem = ({ user, onFollow, onClick }: UserListItemProps) => {
  const getDisplayName = () => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.username;
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center flex-1 cursor-pointer" onClick={onClick}>
        <Avatar className="h-10 w-10 mr-3">
          <AvatarImage src={user.profile_image_url} alt={user.username} />
          <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-sm">{user.username}</p>
          <p className="text-xs text-muted-foreground">{getDisplayName()}</p>
        </div>
      </div>
      <Button 
        variant={user.isFollowing ? "outline" : "default"} 
        size="sm"
        className={user.isFollowing ? "bg-transparent border-muted-foreground/30" : ""}
        onClick={(e) => {
          e.stopPropagation();
          onFollow();
        }}
      >
        {user.isFollowing ? (
          <>
            <UserCheck className="h-4 w-4 mr-1" />
            Following
          </>
        ) : (
          "Follow"
        )}
      </Button>
    </div>
  );
};

export default Search;
