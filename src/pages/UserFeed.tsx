
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Image, Video, Route, Plane, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { UnifiedPostCard } from '@/components/UnifiedPostCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PostUser {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
}

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
  video_url?: string;
  user: PostUser;
}

interface User {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
}

export default function UserFeed() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'posts' | 'videos' | 'paths' | 'trips' | 'journal'>('all');

  useEffect(() => {
    if (userId) {
      fetchUserAndPosts();
    }
  }, [userId]);

  const fetchUserAndPosts = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      // Fetch user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      setProfileUser(userData);

      // Fetch user's posts with user data, trips, paths, and journal entries
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          user:users(id, username, first_name, last_name, profile_image_url),
          trips:trip_id(
            id,
            title,
            destination,
            start_date,
            end_date,
            max_participants,
            budget,
            currency,
            user_id,
            path_id
          ),
          travel_paths:path_id(
            id,
            title,
            description,
            destination,
            difficulty_level,
            estimated_duration,
            path_waypoints(id, title, description, order_index, estimated_time, latitude, longitude, image_url)
          ),
          journal_entries:journal_entry_id(
            id,
            title,
            content,
            location,
            mood,
            image_urls
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      
      // Transform the data to match our Post interface
      const transformedPosts = (postsData || []).map((post: any) => ({
        ...post,
        user: Array.isArray(post.user) ? post.user[0] : post.user,
        trip: Array.isArray(post.trips) ? post.trips[0] : post.trips,
        path: Array.isArray(post.travel_paths) ? post.travel_paths[0] : post.travel_paths,
        journalEntry: Array.isArray(post.journal_entries) ? post.journal_entries[0] : post.journal_entries
      }));
      
      setPosts(transformedPosts);
      
    } catch (error) {
      console.error('Error fetching user feed:', error);
      toast({
        title: "Error",
        description: "Failed to load user posts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatUsername = (user: User | null) => {
    if (!user) return 'Unknown User';
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username || 'Unknown User';
  };

  const getFilteredPosts = () => {
    switch (activeFilter) {
      case 'posts':
        return posts.filter(post => post.image_urls && post.image_urls.length > 0 && !post.video_url && !post.trip_id && !(post as any).path_id && !post.journal_entry_id);
      case 'videos':
        return posts.filter(post => post.video_url);
      case 'paths':
        return posts.filter(post => (post as any).path_id);
      case 'trips':
        return posts.filter(post => post.trip_id);
      case 'journal':
        return posts.filter(post => post.journal_entry_id);
      default:
        return posts;
    }
  };

  const filteredPosts = getFilteredPosts();

  if (loading) {
    return (
      <div className="container px-4 py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-96 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">
            {formatUsername(profileUser)}'s Posts
          </h1>
          <p className="text-sm text-muted-foreground">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as any)} className="w-full mb-6">
        <TabsList className="w-full grid grid-cols-6 h-auto">
          <TabsTrigger value="all" className="text-xs px-2 py-2">
            All
          </TabsTrigger>
          <TabsTrigger value="posts" className="text-xs px-2 py-2">
            <Image className="h-3 w-3 mr-1" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="videos" className="text-xs px-2 py-2">
            <Video className="h-3 w-3 mr-1" />
            Videos
          </TabsTrigger>
          <TabsTrigger value="paths" className="text-xs px-2 py-2">
            <Route className="h-3 w-3 mr-1" />
            Paths
          </TabsTrigger>
          <TabsTrigger value="trips" className="text-xs px-2 py-2">
            <Plane className="h-3 w-3 mr-1" />
            Trips
          </TabsTrigger>
          <TabsTrigger value="journal" className="text-xs px-2 py-2">
            <BookOpen className="h-3 w-3 mr-1" />
            Journal
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Posts */}
      <div className="space-y-6">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post: any) => (
            <UnifiedPostCard
              key={post.id}
              post={post}
              trip={post.trip}
              path={post.path}
              journalEntry={post.journalEntry}
              onProfileClick={(userId) => navigate(`/profile/${userId}`)}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No {activeFilter === 'all' ? 'posts' : activeFilter} yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
