// This file was made by Shantanu Pandey
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageSquare, Share, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNotificationTriggers } from '@/hooks/useNotificationTriggers';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { PostActions } from '@/components/PostActions';
import { PostComments } from '@/components/PostComments';
import { UnifiedPostCard } from '@/components/UnifiedPostCard';

// Define type for users
interface User {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
}

// Define type for posts
interface Post {
  id: string;
  content: string;
  image_urls: string[];
  location: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  comments_count: number;
  user_id: string;
  place_id?: string;
  trip_id?: string;
  privacy_level: string;
  journal_entry_id?: string;
  user: User | null;
  has_liked?: boolean;
}

interface SuggestionWithFollowStatus extends User {
  is_following: boolean;
}

export default function Feed() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<SuggestionWithFollowStatus[]>([]);
  const [commentsOpen, setCommentsOpen] = useState<string | null>(null);
  
  // Trip-related state
  const [trips, setTrips] = useState<any[]>([]);
  const [tripParticipants, setTripParticipants] = useState<{[key: string]: number}>({});
  const [userTripRequests, setUserTripRequests] = useState<{[key: string]: boolean}>({});
  const [userTripParticipation, setUserTripParticipation] = useState<{[key: string]: boolean}>({});
  
  // Path-related state
  const [paths, setPaths] = useState<any[]>([]);
  const [userFollowedPaths, setUserFollowedPaths] = useState<{[key: string]: boolean}>({});
  
  // Journal-related state
  const [journalEntries, setJournalEntries] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchPosts = async () => {
      try {
        console.log('Starting to fetch posts...');
        
        // Fetch posts - exclude user's own posts
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .eq('privacy_level', 'public')
          .neq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);
          
        if (postsError) {
          console.error('Error fetching posts:', postsError);
          throw postsError;
        }

        console.log('Posts fetched:', postsData?.length || 0);

        if (postsData && postsData.length > 0) {
          // Get unique user IDs from posts
          const userIds = [...new Set(postsData.map(post => post.user_id))];
          
          // Fetch user data for all user IDs
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, username, first_name, last_name, profile_image_url')
            .in('id', userIds);
            
          if (usersError) {
            console.error('Error fetching users:', usersError);
            throw usersError;
          }

          // Create a map of user ID to user data
          const usersMap = new Map();
          usersData?.forEach(userData => {
            usersMap.set(userData.id, userData);
          });

          // Check which posts the current user has liked
          const { data: userLikes, error: likesError } = await supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', user.id);

          if (likesError) {
            console.error('Error fetching likes:', likesError);
          }

          const likedPostIds = userLikes?.map(like => like.post_id) || [];
          
          // Combine posts with user data and like status
          const postsWithUserData = postsData.map(post => ({
            ...post,
            user: usersMap.get(post.user_id) || null,
            has_liked: likedPostIds.includes(post.id)
          }));

          console.log('Posts processed:', postsWithUserData.length);
          
          // Categorize posts by type
          const tripPosts = postsWithUserData.filter(p => p.trip_id);
          const journalPosts = postsWithUserData.filter(p => p.journal_entry_id);
          
          console.log('Trip posts found:', tripPosts.length);
          console.log('Journal posts found:', journalPosts.length);
          
          setPosts(postsWithUserData);

          // Fetch trip data for trip posts
          await fetchTripData(tripPosts);
          
          // Fetch journal data for journal posts
          await fetchJournalData(journalPosts);
          
          // Fetch path data for path posts
          await fetchPathData(postsWithUserData);

        }
      } catch (error) {
        console.error('Error fetching posts:', error);
        toast({
          title: "Error",
          description: "Failed to load posts",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchTripData = async (tripPosts: Post[]) => {
      if (tripPosts.length === 0) return;

      const tripIds = tripPosts.map(post => post.trip_id).filter(Boolean);
      console.log('Fetching trip data for IDs:', tripIds);

      try {
        // Fetch trip details
        const { data: tripsData, error: tripsError } = await supabase
          .from('trips')
          .select('*')
          .in('id', tripIds);

        if (tripsError) {
          console.error('Error fetching trips:', tripsError);
          return;
        }

        console.log('Trips data fetched:', tripsData?.length || 0);
        setTrips(tripsData || []);

        const { data: participantsData, error: participantsError } = await supabase
          .from('trip_participants')
          .select('trip_id')
          .in('trip_id', tripIds)
          .eq('status', 'confirmed');

        if (!participantsError && participantsData) {
          const participantCounts: {[key: string]: number} = {};
          participantsData.forEach(participant => {
            participantCounts[participant.trip_id] = (participantCounts[participant.trip_id] || 0) + 1;
          });
          setTripParticipants(participantCounts);
          console.log('Participant counts:', participantCounts);
        }

        const { data: requestsData, error: requestsError } = await supabase
          .from('trip_join_requests')
          .select('trip_id')
          .in('trip_id', tripIds)
          .eq('user_id', user.id)
          .eq('status', 'pending');

        if (!requestsError && requestsData) {
          const userRequests: {[key: string]: boolean} = {};
          requestsData.forEach(request => {
            userRequests[request.trip_id] = true;
          });
          setUserTripRequests(userRequests);
          console.log('User trip requests:', userRequests);
        }

        const { data: userParticipationData, error: userParticipationError } = await supabase
          .from('trip_participants')
          .select('trip_id')
          .in('trip_id', tripIds)
          .eq('user_id', user.id)
          .eq('status', 'confirmed');

        if (!userParticipationError && userParticipationData) {
          const userParticipation: {[key: string]: boolean} = {};
          userParticipationData.forEach(participation => {
            userParticipation[participation.trip_id] = true;
          });
          setUserTripParticipation(userParticipation);
          console.log('User trip participation:', userParticipation);
        }

      } catch (error) {
        console.error('Error fetching trip data:', error);
      }
    };

    const fetchJournalData = async (journalPosts: Post[]) => {
      if (journalPosts.length === 0) return;

      const journalIds = journalPosts.map(post => post.journal_entry_id).filter(Boolean);
      console.log('Fetching journal data for IDs:', journalIds);

      try {
        const { data: journalData, error: journalError } = await supabase
          .from('journal_entries')
          .select('*')
          .in('id', journalIds);

        if (journalError) {
          console.error('Error fetching journal entries:', journalError);
          return;
        }

        console.log('Journal data fetched:', journalData?.length || 0);
        setJournalEntries(journalData || []);
      } catch (error) {
        console.error('Error fetching journal data:', error);
      }
    };

    const fetchPathData = async (pathPostsToFetch: Post[]) => {
      // Get all posts that have path_id
      const postsWithPathId = pathPostsToFetch.filter(p => (p as any).path_id);
      
      if (postsWithPathId.length === 0) return;
      
      const pathIds = postsWithPathId.map(post => (post as any).path_id).filter(Boolean);
      console.log('Fetching path data for IDs:', pathIds);

      try {
        const { data: pathsData, error: pathsError } = await supabase
          .from('travel_paths')
          .select(`
            *,
            path_waypoints (
              id, title, description, order_index, estimated_time,
              latitude, longitude, image_url
            )
          `)
          .in('id', pathIds);

        if (pathsError) {
          console.error('Error fetching paths:', pathsError);
          return;
        }

        console.log('Paths data fetched:', pathsData?.length || 0);
        
        // Transform waypoints for display
        const transformedPaths = pathsData?.map(path => ({
          ...path,
          waypoints: (path.path_waypoints || []).sort((a: any, b: any) => a.order_index - b.order_index)
        })) || [];
        
        setPaths(transformedPaths);

        // Check which paths the user is following
        if (user) {
          const { data: followedPathsData, error: followedError } = await supabase
            .from('user_followed_paths')
            .select('path_id')
            .in('path_id', pathIds)
            .eq('user_id', user.id);

          if (!followedError && followedPathsData) {
            const followedPaths: {[key: string]: boolean} = {};
            followedPathsData.forEach(fp => {
              followedPaths[fp.path_id] = true;
            });
            setUserFollowedPaths(followedPaths);
          }
        }
      } catch (error) {
        console.error('Error fetching path data:', error);
      }
    };

    const fetchSuggestions = async () => {
      try {
        // Get all users except current user
        const { data: allUsersData, error: usersError } = await supabase
          .from('users')
          .select('id, username, first_name, last_name, profile_image_url')
          .neq('id', user.id)
          .limit(10);
          
        if (usersError) throw usersError;

        if (allUsersData) {
          // Get users the current user is following
          const { data: followingData, error: followingError } = await supabase
            .from('user_follows')
            .select('following_id')
            .eq('follower_id', user.id);

          if (followingError) throw followingError;

          const followingIds = followingData?.map(f => f.following_id) || [];
          
          // Filter out already followed users and add follow status
          const suggestionsWithStatus: SuggestionWithFollowStatus[] = allUsersData
            .filter(userData => !followingIds.includes(userData.id))
            .slice(0, 5)
            .map(userData => ({
              ...userData,
              is_following: false
            }));
          
          setSuggestions(suggestionsWithStatus);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    };

    fetchPosts();
    fetchSuggestions();
  }, [navigate, toast, user]);

  const handlePostDeleted = (deletedPostId: string) => {
    setPosts(posts.filter(post => post.id !== deletedPostId));
  };

  const handlePostUpdated = (postId: string, newContent: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, content: newContent }
        : post
    ));
  };

  const { triggerLikeNotification, removeLikeNotification } = useNotificationTriggers();

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!user) return;

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      // Optimistically update UI - prevent negative likes
      const newLikesCount = isLiked 
        ? Math.max(0, post.likes_count - 1) 
        : post.likes_count + 1;

      setPosts(posts.map(p => 
        p.id === postId 
          ? { 
              ...p, 
              has_liked: !isLiked, 
              likes_count: newLikesCount
            } 
          : p
      ));

      if (isLiked) {
        // Remove like
        await supabase
          .from('post_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);
          
        // Remove notification
        removeLikeNotification(postId);
      } else {
        // Add like
        await supabase
          .from('post_likes')
          .insert({ user_id: user.id, post_id: postId });
          
        // Trigger notification with delay
        triggerLikeNotification(postId, post.user_id);
      }

    } catch (error) {
      console.error('Error updating like:', error);
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive"
      });
      
      // Revert UI on error
      const post = posts.find(p => p.id === postId);
      if (post) {
        setPosts(posts.map(p => 
          p.id === postId 
            ? { 
                ...p, 
                has_liked: isLiked,
                likes_count: post.likes_count
              } 
            : p
        ));
      }
    }
  };

  const handleFollowSuggestion = async (userId: string) => {
    if (!user) return;
    
    try {
      await supabase
        .from('user_follows')
        .insert({ follower_id: user.id, following_id: userId });
        
      setSuggestions(suggestions.map(suggestion => 
        suggestion.id === userId 
          ? { ...suggestion, is_following: true }
          : suggestion
      ));
      
      toast({
        title: "Success",
        description: "User followed successfully"
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

  const handleProfileClick = (userId: string) => {
    if (userId === user?.id) {
      navigate('/profile');
    } else {
      navigate(`/profile/${userId}`);
    }
  };

  const handleShare = async (post: Post) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out this post by ${formatUsername(post.user)}`,
          text: post.content,
          url: window.location.origin + `/post/${post.id}`,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        handleCopyLink(post);
      }
    } else {
      handleCopyLink(post);
    }
  };

  const handleCopyLink = (post: Post) => {
    const url = window.location.origin + `/post/${post.id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "Link copied",
        description: "Post link has been copied to clipboard"
      });
    }).catch(() => {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive"
      });
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-8">
        <Skeleton className="h-48 w-full mb-8" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const formatUsername = (user: User | null) => {
    if (!user) return 'Unknown User';
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username || 'Unknown User';
  };

  const getInitials = (user: User | null) => {
    if (!user) return 'UU';
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user.username?.substring(0, 2).toUpperCase() || 'UU';
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Main feed - larger on desktop */}
        <div className="lg:col-span-3 space-y-6">
          {posts.length > 0 ? (
            posts.map(post => {
              console.log('Rendering post:', post.id, 'Type check - trip_id:', post.trip_id, 'journal_id:', post.journal_entry_id);
              
              // Determine post type and get associated data
              let trip = undefined;
              let path = undefined;
              let journalEntry = undefined;
              let currentParticipants = 0;
              let hasRequested = false;
              let isParticipant = false;
              let isFollowingPath = false;

              if (post.trip_id) {
                trip = trips.find(t => t.id === post.trip_id);
                currentParticipants = tripParticipants[post.trip_id] || 0;
                hasRequested = userTripRequests[post.trip_id] || false;
                isParticipant = userTripParticipation[post.trip_id] || false;
                
                console.log('Trip post data:', {
                  tripFound: !!trip,
                  tripId: post.trip_id,
                  currentParticipants,
                  hasRequested,
                  isParticipant
                });
              }

              if (post.journal_entry_id) {
                journalEntry = journalEntries.find(j => j.id === post.journal_entry_id);
                console.log('Journal post data:', {
                  journalFound: !!journalEntry,
                  journalId: post.journal_entry_id
                });
              }

              if ((post as any).path_id) {
                path = paths.find(p => p.id === (post as any).path_id);
                isFollowingPath = userFollowedPaths[(post as any).path_id] || false;
                console.log('Path post data:', {
                  pathFound: !!path,
                  pathId: (post as any).path_id,
                  isFollowing: isFollowingPath
                });
              }

              return (
                <UnifiedPostCard
                  key={post.id}
                  post={post}
                  trip={trip}
                  path={path}
                  journalEntry={journalEntry}
                  currentParticipants={currentParticipants}
                  hasRequested={hasRequested}
                  isParticipant={isParticipant}
                  isFollowingPath={isFollowingPath}
                  onLike={handleLike}
                  onShare={handleShare}
                  onProfileClick={handleProfileClick}
                  onPostDeleted={handlePostDeleted}
                  onComment={(postId) => setCommentsOpen(postId)}
                />
              );
            })
          ) : (
            <Card className="p-8 text-center">
              <div className="text-muted-foreground mb-2">
                No posts available
              </div>
              <p className="text-sm text-muted-foreground">
                Follow more people or create your own post
              </p>
            </Card>
          )}
        </div>

        {/* Sidebar with suggestions - wider on desktop */}
        <div className="hidden lg:block lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-6">People to follow</h3>
              
              {suggestions.length > 0 ? (
                <div className="space-y-4">
                  {suggestions.map(suggestion => (
                    <div key={suggestion.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <Avatar 
                          className="cursor-pointer hover:opacity-80 transition-opacity w-10 h-10 flex-shrink-0"
                          onClick={() => handleProfileClick(suggestion.id)}
                        >
                          <AvatarImage src={suggestion.profile_image_url} />
                          <AvatarFallback className="text-sm">{getInitials(suggestion)}</AvatarFallback>
                        </Avatar>
                        <div 
                          className="text-sm font-medium cursor-pointer hover:underline truncate"
                          onClick={() => handleProfileClick(suggestion.id)}
                        >
                          {formatUsername(suggestion)}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant={suggestion.is_following ? "outline" : "default"}
                        onClick={() => handleFollowSuggestion(suggestion.id)}
                        disabled={suggestion.is_following}
                        className={`text-sm h-8 px-3 flex-shrink-0 ${suggestion.is_following ? "text-muted-foreground" : ""}`}
                      >
                        {suggestion.is_following ? 'Following' : 'Follow'}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-6">
                  No more suggestions available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Comments Modal */}
      <PostComments
        postId={commentsOpen || ''}
        isOpen={!!commentsOpen}
        onClose={() => setCommentsOpen(null)}
      />
    </div>
  );
}
