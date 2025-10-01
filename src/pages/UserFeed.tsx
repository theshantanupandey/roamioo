
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

      // Fetch user's posts with user data
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          user:users(id, username, first_name, last_name, profile_image_url)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      
      // Transform the data to match our Post interface
      const transformedPosts = (postsData || []).map(post => ({
        ...post,
        user: Array.isArray(post.user) ? post.user[0] : post.user
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

      {/* Posts */}
      <div className="space-y-6">
        {posts.length > 0 ? (
          posts.map(post => (
            <UnifiedPostCard
              key={post.id}
              post={post}
              onProfileClick={(userId) => navigate(`/profile/${userId}`)}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No posts yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
