import React, { useState, useEffect } from 'react';
import { User, LogOut, Settings, HelpCircle, MapPin, ChevronRight, Grid, Route, Mail, MessageSquare, Award, Star, Badge as BadgeIcon, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { FollowingList } from '@/components/FollowingList';
import { StatCard } from '@/components/StatCard';
import { useDevice } from '@/hooks/use-device';
import { useNotificationTriggers } from '@/hooks/useNotificationTriggers';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageIcon } from '@/components/messaging/MessageIcon';

interface ProfileData {
  username: string;
  name: string;
  bio: string;
  location: string;
  avatar: string;
  stats: {
    posts: number;
    followers: number;
    following: number;
  };
  website: string;
}

interface Post {
  id: string;
  image_urls: string[];
  likes_count: number;
  trip_id?: string;
  video_url?: string;
}

interface Path {
  id: string;
  title: string;
  image_url: string;
  location: string;
  stops: number;
}

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { userId } = useParams();
  const { isMobile } = useDevice();
  const [activeTab, setActiveTab] = useState("posts");
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPaths, setSavedPaths] = useState<Path[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isOwn, setIsOwn] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [userStats, setUserStats] = useState({
    tripsCompleted: 0,
    creditsEarned: 0,
    romioLevel: 'Explorer',
    totalLikesReceived: 0
  });

  const profileUserId = userId || user?.id;

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { returnUrl: location.pathname } });
      return;
    }
    
    setIsOwn(!userId || userId === user?.id);
    fetchProfileData();
    fetchJournalEntries();
    
    if (!isOwn && user?.id) {
      checkFollowStatus();
    }
  }, [toast, user, navigate, location.pathname, userId]);

  const checkFollowStatus = async () => {
    if (!user?.id || !profileUserId || isOwn) return;
    
    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', profileUserId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const { triggerFollowNotification, removeFollowNotification } = useNotificationTriggers();

  const handleFollowToggle = async () => {
    if (!user?.id || !profileUserId || isOwn) return;
    
    try {
      if (isFollowing) {
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profileUserId);
        
        setIsFollowing(false);
        if (profileData) {
          setProfileData({
            ...profileData,
            stats: { ...profileData.stats, followers: profileData.stats.followers - 1 }
          });
        }
        
        // Remove notification
        removeFollowNotification(profileUserId);
        
        toast({
          title: "Unfollowed",
          description: `You unfollowed ${profileData?.name}`
        });
      } else {
        await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: profileUserId
          });
        
        setIsFollowing(true);
        if (profileData) {
          setProfileData({
            ...profileData,
            stats: { ...profileData.stats, followers: profileData.stats.followers + 1 }
          });
        }
        
        // Trigger notification with delay
        triggerFollowNotification(profileUserId);
        
        toast({
          title: "Following",
          description: `You are now following ${profileData?.name}`
        });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive"
      });
    }
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

  const handleFollowersClick = () => {
    setShowFollowers(true);
    fetchFollowers();
  };

  const fetchJournalEntries = async () => {
    if (!profileUserId) return;
    
    try {
      const { data: journalData, error: journalError } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', profileUserId)
        .order('created_at', { ascending: false });

      if (journalError) throw journalError;
      setJournalEntries(journalData || []);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
    }
  };

  async function fetchProfileData() {
    if (!profileUserId) return;
    
    setLoading(true);
    try {
      let profileName = '';
      let profileUsername = '';
      let profileBio = '';
      let profileLocation = '';
      let profileAvatar = '';
      let postsCount = 0; // Declare at function level

      if (user.user_metadata?.first_name || user.user_metadata?.full_name) {
        profileName = user.user_metadata.full_name || 
                      `${user.user_metadata.first_name || ''} ${user.user_metadata.last_name || ''}`.trim();
      }
      
      profileAvatar = user.user_metadata?.avatar_url || '';
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', profileUserId)
        .maybeSingle();
        
      if (userData && !userError) {
        profileUsername = userData.username || user.email?.split('@')[0] || '';
        profileBio = userData.bio || '';
        profileLocation = `${userData.city || ''}, ${userData.country || ''}`.replace(', ,', '').replace(/^, /, '').replace(/, $/, '');
        
        if (!profileName) {
          profileName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.username || '';
        }
        
        if (!profileAvatar) {
          profileAvatar = userData.profile_image_url || '';
        }

        // Fetch posts count first
        const { count } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profileUserId);
        postsCount = count || 0;

        // Fetch actual trips count dynamically
        const { count: actualTripsCount } = await supabase
          .from('trips')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profileUserId);

        // Calculate credits based on activity (1 credit per post, 5 per trip, 2 per journal)
        const creditsFromPosts = (postsCount || 0) * 1;
        const creditsFromTrips = (actualTripsCount || 0) * 5;
        const creditsFromJournals = journalEntries.length * 2;
        const totalCredits = creditsFromPosts + creditsFromTrips + creditsFromJournals;

        // Calculate level based on credits
        let level = 'Explorer';
        if (totalCredits >= 100) level = 'Master';
        else if (totalCredits >= 50) level = 'Expert';
        else if (totalCredits >= 20) level = 'Adventurer';

        // Get total likes from all posts
        const { data: postsWithLikes } = await supabase
          .from('posts')
          .select('likes_count')
          .eq('user_id', profileUserId);
        
        const totalLikes = postsWithLikes?.reduce((sum, post) => sum + (post.likes_count || 0), 0) || 0;

        setUserStats({
          tripsCompleted: actualTripsCount || 0,
          creditsEarned: totalCredits,
          romioLevel: level,
          totalLikesReceived: totalLikes
        });
      } else {
        profileUsername = user.email?.split('@')[0] || '';
        if (!profileName) {
          profileName = profileUsername;
        }
        
        // Fetch posts count if not already fetched
        const { count } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profileUserId);
        postsCount = count || 0;
      }
      
      // postsCount is now available at this scope
      const { count: followersCount } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', profileUserId);
        
      const { count: followingCount } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', profileUserId);
        
      const profile: ProfileData = {
        username: profileUsername,
        name: profileName,
        bio: profileBio,
        location: profileLocation,
        avatar: profileAvatar,
        stats: {
          posts: postsCount,
          followers: followersCount || 0,
          following: followingCount || 0,
        },
        website: ''
      };
      
      setProfileData(profile);
      
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('id, image_urls, likes_count, trip_id, video_url')
        .eq('user_id', profileUserId)
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (postsError) {
        console.error('Error fetching posts:', postsError);
      } else if (postsData) {
        setPosts(postsData);
      }
      
      const { data: pathsData, error: pathsError } = await supabase
        .from('travel_paths')
        .select(`
          id,
          title,
          image_url,
          description,
          estimated_duration,
          difficulty_level,
          path_waypoints(count)
        `)
        .eq('created_by', profileUserId)
        .order('created_at', { ascending: false })
        .limit(20);
        
      if (!pathsError && pathsData) {
        const formattedPaths = pathsData.map(path => ({
          id: path.id,
          title: path.title || 'Unnamed Path',
          image_url: path.image_url || '/placeholder.svg',
          location: path.description || '',
          stops: path.path_waypoints?.[0]?.count || 0
        }));
        
        setSavedPaths(formattedPaths);
      }
        
    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('isLoggedIn');
      toast({
        title: "Logged out",
        description: "You have been successfully logged out"
      });
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive"
      });
    }
  };
  
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2).replace(/\.?0+$/, '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.?0+$/, '') + 'K';
    }
    return num;
  };

  const handlePostClick = (postId: string) => {
    navigate(`/user/${profileUserId}/feed`);
  };

  const handleJournalEntryClick = (journalEntry: any) => {
    if (journalEntry.post_id) {
      navigate(`/user/${profileUserId}/feed`);
    } else {
      navigate('/journal');
    }
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

  const handleMessageClick = () => {
    if (!profileUserId || isOwn) return;
    
    // Navigate to messages page with the user parameter
    navigate(`/messages?user=${profileUserId}`);
  };

  if (loading) {
    return (
      <div className="px-4 flex flex-col items-center justify-center h-screen">
        <div className="w-full max-w-md space-y-6">
          <div className="h-20 w-20 rounded-full bg-muted animate-pulse mx-auto"></div>
          <div className="space-y-2">
            <div className="h-6 bg-muted animate-pulse rounded-md"></div>
            <div className="h-4 bg-muted animate-pulse rounded-md w-3/4"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-12 bg-muted animate-pulse rounded-md w-1/5"></div>
            <div className="h-12 bg-muted animate-pulse rounded-md w-1/5"></div>
            <div className="h-12 bg-muted animate-pulse rounded-md w-1/5"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData || !user) {
    return (
      <div className="px-4 py-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
          <User className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold mb-2">Profile Not Available</h2>
        <p className="text-muted-foreground mb-6">Unable to load profile information</p>
        <Button 
          onClick={() => navigate('/login')} 
          className="rounded-full"
        >
          Sign In
        </Button>
      </div>
    ); 
  }

  const creatorStats = [
    {
      title: "Trips",
      value: userStats.tripsCompleted,
      icon: Route,
      color: 'blue' as const
    },
    {
      title: "Credits",
      value: userStats.creditsEarned,
      icon: Award,
      color: 'amber' as const
    },
    {
      title: "Level",
      value: userStats.romioLevel,
      icon: BadgeIcon,
      color: 'coral' as const
    },
    {
      title: "Likes",
      value: formatNumber(userStats.totalLikesReceived),
      icon: Star,
      color: 'mint' as const
    }
  ];

  const generalPosts = posts.filter((post) => !post.trip_id);
  const tripPosts = posts.filter((post) => post.trip_id);

  return <div className="px-4 pb-28">
      <div className="flex flex-col mt-3">
        <div className="flex items-center justify-between mb-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profileData.avatar} alt={profileData.name} />
            <AvatarFallback>{profileData.name.charAt(0)}</AvatarFallback>
          </Avatar>
          
          <div className="flex items-center gap-3">
            {/* Message button for mobile - show for both own profile and others */}
            {isMobile && (
              <Button 
                size="sm" 
                variant="outline" 
                className="rounded-full px-4 h-10 border-none bg-muted/50"
                onClick={() => navigate('/messages')}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Message
              </Button>
            )}
            
            {!isOwn && (
              <>
                {/* Message button for desktop and other users */}
                {!isMobile && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="rounded-full px-4 h-10 border-none bg-muted/50"
                    onClick={handleMessageClick}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Message
                  </Button>
                )}
              </>
            )}
            
            {isOwn ? (
              <Button 
                size="sm" 
                className="rounded-full px-8 h-10 bg-[#BFF627] hover:bg-[#aae120] text-black font-medium"
                onClick={() => navigate('/account-settings')}
              >
                Edit
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleFollowToggle}
                className={`rounded-full px-8 h-10 font-medium ${
                  isFollowing 
                    ? 'bg-muted hover:bg-muted/80 text-foreground border border-border' 
                    : 'bg-[#BFF627] hover:bg-[#aae120] text-black'
                }`}
                variant={isFollowing ? "outline" : "default"}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex flex-col mb-4">
          <h2 className="text-xl font-bold">{profileData.name}</h2>
          <p className="text-sm text-muted-foreground">{profileData.username}</p>
          
          <div className="flex flex-col gap-1 mt-2">
            <p className="text-sm">{profileData.bio}</p>
            {profileData.location && (
              <p className="text-sm flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-3 w-3" /> 
                {profileData.location}
              </p>
            )}
          </div>
        </div>

        <div className="mb-4">
          <div className="grid grid-cols-4 gap-2">
            {creatorStats.map((stat, index) => (
              <StatCard
                key={index}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
                compact={true}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between py-2 border-y">
        <div 
          className="text-center px-1 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors"
          onClick={() => navigate(`/user/${profileUserId}/feed`)}
        >
          <p className="font-bold text-sm">{formatNumber(profileData.stats.posts)}</p>
          <p className="text-xs text-muted-foreground">Posts</p>
        </div>
        <div 
          className="text-center px-1 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors"
          onClick={handleFollowersClick}
        >
          <p className="font-bold text-sm">{formatNumber(profileData.stats.followers)}</p>
          <p className="text-xs text-muted-foreground">Followers</p>
        </div>
        <div 
          className="text-center px-1 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors" 
          onClick={() => setShowFollowing(true)}
        >
          <p className="font-bold text-sm">{formatNumber(profileData.stats.following)}</p>
          <p className="text-xs text-muted-foreground">Following</p>
        </div>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 border-b rounded-none bg-transparent h-12">
          <TabsTrigger value="posts" className="data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:rounded-none bg-transparent">
            <div className="grid place-items-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2" />
                <rect x="13" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2" />
                <rect x="3" y="13" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2" />
                <rect x="13" y="13" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
          </TabsTrigger>
          <TabsTrigger value="journal" className="data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:rounded-none bg-transparent">
            <MessageSquare className="h-5 w-5" />
          </TabsTrigger>
          <TabsTrigger value="paths" className="data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:rounded-none bg-transparent">
            <Route className="h-5 w-5" />
          </TabsTrigger>
          <TabsTrigger value="trips" className="data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:rounded-none bg-transparent">
            <MapPin className="h-5 w-5" />
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="posts" className="mt-4">
          {generalPosts.length > 0 ? (
            <div className="grid grid-cols-3 gap-1">
              {generalPosts.map(post => (
                <div 
                  key={post.id} 
                  className="relative aspect-square cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handlePostClick(post.id)}
                >
                  <AspectRatio ratio={1 / 1}>
                    {post.video_url ? (
                      <div className="relative w-full h-full bg-black">
                        <video 
                          src={post.video_url} 
                          className="w-full h-full object-cover"
                          poster={post.image_urls && post.image_urls.length > 0 ? post.image_urls[0] : '/placeholder.svg'}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-black/50 rounded-full p-2">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img 
                        src={post.image_urls && post.image_urls.length > 0 ? post.image_urls[0] : '/placeholder.svg'} 
                        alt="Post" 
                        className="w-full h-full object-cover" 
                      />
                    )}
                    <div className="absolute bottom-2 left-2 text-white text-xs flex items-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
                        <path d="M2.42012 12.7132C2.28394 12.4975 2.21584 12.3897 2.17772 12.2234C2.14909 12.0985 2.14909 11.9015 2.17772 11.7766C2.21584 11.6103 2.28394 11.5025 2.42012 11.2868C3.54553 9.50484 6.8954 5 12.0004 5C17.1054 5 20.4553 9.50484 21.5807 11.2868C21.7169 11.5025 21.785 11.6103 21.8231 11.7766C21.8517 11.9015 21.8517 12.0985 21.8231 12.2234C21.785 12.3897 21.7169 12.4975 21.5807 12.7132C20.4553 14.4952 17.1054 19 12.0004 19C6.8954 19 3.54553 14.4952 2.42012 12.7132Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12.0004 15C13.6573 15 15.0004 13.6569 15.0004 12C15.0004 10.3431 13.6573 9 12.0004 9C10.3435 9 9.0004 10.3431 9.0004 12C9.0004 13.6569 10.3435 15 12.0004 15Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {formatNumber(post.likes_count || 0)}
                    </div>
                  </AspectRatio>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <Grid className="h-10 w-10 mb-2 opacity-20" />
              <p>No posts yet</p>
              {isOwn && (
                <Button 
                  className="mt-3 bg-[#BFF627] hover:bg-[#aae120] text-black"
                  onClick={() => navigate('/create-post')}
                >
                  Create your first post
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="journal" className="mt-4">
          {journalEntries.length > 0 ? (
            <div className="space-y-4">
              {journalEntries.map(entry => (
                <Card 
                  key={entry.id} 
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleJournalEntryClick(entry)}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">{entry.title}</h3>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">{entry.content}</p>
                    {entry.location && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 mr-1" />
                        {entry.location}
                      </div>
                    )}
                    {entry.mood && (
                      <Badge variant="outline" className="text-xs">
                        {entry.mood}
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <MessageSquare className="h-10 w-10 mb-2 opacity-20" />
              <p>No journal entries yet</p>
              {isOwn && (
                <Button 
                  className="mt-3 bg-[#BFF627] hover:bg-[#aae120] text-black"
                  onClick={() => navigate('/journal')}
                >
                  Create your first entry
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="paths" className="mt-4">
          {savedPaths.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {savedPaths.map(path => (
                <Card key={path.id} className="p-4">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={path.image_url || '/placeholder.svg'} 
                      alt={path.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{path.title}</h3>
                      <p className="text-sm text-muted-foreground">{path.stops} stops</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <Route className="h-10 w-10 mb-2 opacity-20" />
              <p>No saved paths yet</p>
              {isOwn && (
                <Button 
                  className="mt-3 bg-[#BFF627] hover:bg-[#aae120] text-black"
                  onClick={() => navigate('/discover')}
                >
                  Discover paths
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="trips" className="mt-4">
          {tripPosts.length > 0 ? (
            <div className="grid grid-cols-3 gap-1">
              {tripPosts.map(post => (
                <div 
                  key={post.id} 
                  className="relative aspect-square cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handlePostClick(post.id)}
                >
                  <AspectRatio ratio={1 / 1}>
                    <img 
                      src={post.image_urls && post.image_urls.length > 0 ? post.image_urls[0] : '/placeholder.svg'} 
                      alt="Trip Post" 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute bottom-2 left-2 text-white text-xs flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      Trip
                    </div>
                  </AspectRatio>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <MapPin className="h-10 w-10 mb-2 opacity-20" />
              <p>No trip posts yet</p>
              {isOwn && (
                <Button 
                  className="mt-3 bg-[#BFF627] hover:bg-[#aae120] text-black"
                  onClick={() => navigate('/trips')}
                >
                  Plan your first trip
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showFollowers} onOpenChange={setShowFollowers}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Followers</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {followersLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-muted rounded-full animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-1/3 animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : followers.length > 0 ? (
              <div className="space-y-4">
                {followers.map(follow => (
                  <div 
                    key={follow.id} 
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div 
                      className="flex items-center space-x-3 cursor-pointer flex-1"
                      onClick={() => {
                        navigate(`/profile/${follow.follower.id}`);
                        setShowFollowers(false);
                      }}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={follow.follower.profile_image_url} />
                        <AvatarFallback>{getUserInitials(follow.follower)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{formatUserDisplay(follow.follower)}</div>
                        <div className="text-sm text-muted-foreground">
                          @{follow.follower.username || 'user'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No followers yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {showFollowing && (
        <FollowingList 
          userId={profileUserId!} 
          isOpen={showFollowing} 
          onClose={() => setShowFollowing(false)} 
        />
      )}
    </div>;
}
