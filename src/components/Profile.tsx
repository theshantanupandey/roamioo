import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, MapPin, Calendar, Users, Heart, MessageSquare, Settings, UserPlus, UserMinus, Edit, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UnifiedPostCard } from './UnifiedPostCard';
import { MessageIcon } from './messaging/MessageIcon';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface User {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  profile_image_url?: string;
  banner_image_url?: string;
  city?: string;
  country?: string;
  date_of_birth?: string;
  created_at: string;
  total_posts: number;
  total_likes_received: number;
  trips_completed: number;
  credits_earned: number;
  romio_level: string;
}

interface Post {
  id: string;
  content: string;
  image_urls: string[];
  location: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  user_id: string;
  trip_id?: string;
  journal_entry_id?: string;
  video_url?: string;
  user: User;
  has_liked?: boolean;
}

interface ProfileStats {
  followers: number;
  following: number;
  posts: number;
}

export const Profile: React.FC = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<ProfileStats>({ followers: 0, following: 0, posts: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);

  const profileUserId = userId || currentUser?.id;
  const isOwnProfile = !userId || userId === currentUser?.id;
  
  // Add new dialog states
  const [showFollowersDialog, setShowFollowersDialog] = useState(false);
  const [showFollowingDialog, setShowFollowingDialog] = useState(false);
  const [showPostsDialog, setShowPostsDialog] = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);

  useEffect(() => {
    if (profileUserId) {
      fetchUserProfile();
      fetchUserPosts();
      fetchUserStats();
      if (!isOwnProfile) {
        checkFollowStatus();
      }
    }
  }, [profileUserId, currentUser?.id]);

  const fetchUserProfile = async () => {
    if (!profileUserId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', profileUserId)
        .single();

      if (error) throw error;
      setUser(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    if (!profileUserId) return;

    try {
      setPostsLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users(id, username, first_name, last_name, profile_image_url)
        `)
        .eq('user_id', profileUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Check which posts the current user has liked
      const { data: userLikes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', currentUser?.id || '');

      const likedPostIds = userLikes?.map(like => like.post_id) || [];

      const postsWithLikes = (data || []).map(post => ({
        ...post,
        user: Array.isArray(post.user) ? post.user[0] : post.user,
        has_liked: likedPostIds.includes(post.id)
      }));

      setPosts(postsWithLikes);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive"
      });
    } finally {
      setPostsLoading(false);
    }
  };

  const fetchUserStats = async () => {
    if (!profileUserId) return;

    try {
      // Fetch followers count
      const { count: followersCount } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', profileUserId);

      // Fetch following count
      const { count: followingCount } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', profileUserId);

      // Fetch posts count
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profileUserId);

      setStats({
        followers: followersCount || 0,
        following: followingCount || 0,
        posts: postsCount || 0
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const checkFollowStatus = async () => {
    if (!currentUser?.id || !profileUserId) return;

    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', currentUser.id)
        .eq('following_id', profileUserId)
        .single();

      setIsFollowing(!!data);
    } catch (error) {
      // Not following or error - treat as not following
      setIsFollowing(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser?.id || !profileUserId) return;

    try {
      if (isFollowing) {
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', profileUserId);
        
        setIsFollowing(false);
        setStats(prev => ({ ...prev, followers: prev.followers - 1 }));
        
        toast({
          title: "Unfollowed",
          description: "You have unfollowed this user"
        });
      } else {
        await supabase
          .from('user_follows')
          .insert({
            follower_id: currentUser.id,
            following_id: profileUserId
          });
        
        setIsFollowing(true);
        setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
        
        toast({
          title: "Following",
          description: "You are now following this user"
        });
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive"
      });
    }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!currentUser?.id) return;

    try {
      if (isLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUser.id);
      } else {
        await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: currentUser.id });
      }

      // Update local state
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            has_liked: !isLiked,
            likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error liking post:', error);
      toast({
        title: "Error",
        description: "Failed to like post",
        variant: "destructive"
      });
    }
  };

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

  const fetchFollowers = async () => {
    if (!profileUserId) return;
    
    try {
      setFollowersLoading(true);
      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          *,
          follower:users!follower_id(id, username, first_name, last_name, profile_image_url)
        `)
        .eq('following_id', profileUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFollowers(data || []);
    } catch (error) {
      console.error('Error fetching followers:', error);
      toast({
        title: "Error",
        description: "Failed to load followers",
        variant: "destructive"
      });
    } finally {
      setFollowersLoading(false);
    }
  };

  const fetchFollowing = async () => {
    if (!profileUserId) return;
    
    try {
      setFollowingLoading(true);
      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          *,
          following:users!following_id(id, username, first_name, last_name, profile_image_url)
        `)
        .eq('follower_id', profileUserId)
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
      setFollowingLoading(false);
    }
  };

  const handleFollowersClick = () => {
    navigate(`/profile/${profileUserId}/followers`);
  };

  const handleFollowingClick = () => {
    navigate(`/profile/${profileUserId}/following`);
  };

  const handlePostsClick = () => {
    setShowPostsDialog(true);
  };

  const formatUserDisplay = (user: any) => {
    if (!user) return 'Unknown User';
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username || 'Unknown User';
  };

  const getUserInitials = (user: any) => {
    if (!user) return 'UU';
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user.username?.substring(0, 2).toUpperCase() || 'UU';
  };

  if (loading) {
    return (
      <div className="container px-4 py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-muted rounded"></div>
          <div className="flex items-center space-x-4">
            <div className="h-20 w-20 bg-muted rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-32"></div>
              <div className="h-4 bg-muted rounded w-24"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container px-4 py-6">
        <div className="text-center">
          <p className="text-muted-foreground">User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-6 max-w-4xl mx-auto">
      {/* Banner */}
      <div className="relative h-32 md:h-48 mb-4 rounded-xl overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600">
        {user.banner_image_url && (
          <img 
            src={user.banner_image_url} 
            alt="Banner" 
            className="w-full h-full object-cover"
          />
        )}
        {isOwnProfile && (
          <Button 
            variant="secondary" 
            size="sm" 
            className="absolute top-2 right-2"
            onClick={() => navigate('/account-settings')}
          >
            <Camera className="h-4 w-4 mr-2" />
            Edit Banner
          </Button>
        )}
      </div>

      {/* Profile Header */}
      <div className="flex flex-col md:flex-row md:items-start gap-6 mb-6">
        <div className="flex flex-col items-center md:items-start">
          <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-background">
            <AvatarImage src={user.profile_image_url} />
            <AvatarFallback className="text-lg">{getInitials(user)}</AvatarFallback>
          </Avatar>
          {isOwnProfile && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => navigate('/account-settings')}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>

        <div className="flex-1 text-center md:text-left">
          <h1 className="text-2xl font-bold mb-2">{formatUsername(user)}</h1>
          <p className="text-muted-foreground mb-2">@{user.username}</p>
          
          {user.bio && (
            <p className="text-sm mb-4">{user.bio}</p>
          )}

          <div className="flex items-center justify-center md:justify-start gap-4 mb-4 text-sm text-muted-foreground">
            {(user.city || user.country) && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {[user.city, user.country].filter(Boolean).join(', ')}
              </div>
            )}
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
            </div>
          </div>

          {/* Stats - Make them clickable */}
          <div className="flex justify-center md:justify-start gap-6 mb-4">
            <button 
              onClick={handlePostsClick}
              className="text-center hover:text-primary transition-colors cursor-pointer"
            >
              <div className="font-bold">{stats.posts}</div>
              <div className="text-sm text-muted-foreground">Posts</div>
            </button>
            <button 
              onClick={handleFollowersClick}
              className="text-center hover:text-primary transition-colors cursor-pointer"
            >
              <div className="font-bold">{stats.followers}</div>
              <div className="text-sm text-muted-foreground">Followers</div>
            </button>
            <button 
              onClick={handleFollowingClick}
              className="text-center hover:text-primary transition-colors cursor-pointer"
            >
              <div className="font-bold">{stats.following}</div>
              <div className="text-sm text-muted-foreground">Following</div>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center md:justify-start gap-2">
            {isOwnProfile ? (
              <>
                <Button onClick={() => navigate('/account-settings')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <MessageIcon />
              </>
            ) : (
              <>
                <Button onClick={handleFollow} variant={isFollowing ? "outline" : "default"}>
                  {isFollowing ? (
                    <>
                      <UserMinus className="h-4 w-4 mr-2" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
                <MessageIcon 
                  targetUserId={user.id}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* User Level and Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Badge variant="secondary" className="mb-2">{user.romio_level}</Badge>
            <div className="text-sm text-muted-foreground">Romio Level</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-lg font-bold text-orange-600">{user.credits_earned}</div>
            <div className="text-sm text-muted-foreground">Credits</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-lg font-bold text-red-500">{user.total_likes_received}</div>
            <div className="text-sm text-muted-foreground">Likes Received</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-lg font-bold text-green-600">{user.trips_completed}</div>
            <div className="text-sm text-muted-foreground">Trips Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="trips">Trips</TabsTrigger>
          <TabsTrigger value="journal">Journal</TabsTrigger>
        </TabsList>
        
        <TabsContent value="posts" className="mt-6">
          <div className="space-y-6">
            {postsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-96 bg-muted animate-pulse rounded"></div>
                ))}
              </div>
            ) : posts.length > 0 ? (
              posts.map(post => (
                <UnifiedPostCard
                  key={post.id}
                  post={post}
                  onLike={handleLike}
                  onProfileClick={(userId) => navigate(`/profile/${userId}`)}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No posts yet</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="trips" className="mt-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">No trips shared yet</p>
          </div>
        </TabsContent>
        
        <TabsContent value="journal" className="mt-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">No journal entries shared yet</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Following Dialog */}
      <Dialog open={showFollowingDialog} onOpenChange={setShowFollowingDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Following</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {followingLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-muted rounded-full animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-1/3 animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : following.length > 0 ? (
              <div className="space-y-4">
                {following.map(follow => (
                  <div 
                    key={follow.id} 
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div 
                      className="flex items-center space-x-3 cursor-pointer flex-1"
                      onClick={() => {
                        navigate(`/profile/${follow.following.id}`);
                        setShowFollowingDialog(false);
                      }}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={follow.following.profile_image_url} />
                        <AvatarFallback>{getUserInitials(follow.following)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{formatUserDisplay(follow.following)}</div>
                        <div className="text-sm text-muted-foreground">
                          @{follow.following.username || 'user'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Not following anyone yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Posts Dialog */}
      <Dialog open={showPostsDialog} onOpenChange={setShowPostsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Posts</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {postsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-96 bg-muted animate-pulse rounded"></div>
                ))}
              </div>
            ) : posts.length > 0 ? (
              <div className="space-y-6">
                {posts.map(post => (
                  <UnifiedPostCard
                    key={post.id}
                    post={post}
                    onLike={handleLike}
                    onProfileClick={(userId) => {
                      navigate(`/profile/${userId}`);
                      setShowPostsDialog(false);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No posts yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
