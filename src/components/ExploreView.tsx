import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UnifiedPostCard } from '@/components/UnifiedPostCard';
import { Loader2, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Post {
  id: string;
  content: string;
  image_urls: string[] | null;
  video_url: string | null;
  location: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
  user_id: string;
  trip_id: string | null;
  privacy_level: string;
  user: {
    id: string;
    username: string;
    first_name: string | null;
    last_name: string | null;
    profile_image_url: string | null;
  };
}

export const ExploreView = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchPopularPosts();
  }, []);

  const fetchPopularPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users!posts_user_id_fkey(
            id,
            username,
            first_name,
            last_name,
            profile_image_url
          )
        `)
        .eq('privacy_level', 'public')
        .order('likes_count', { ascending: false })
        .limit(20);

      if (error) throw error;

      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching popular posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('post_likes')
        .insert({ post_id: postId, user_id: user.id });
      
      if (!error) {
        fetchPopularPosts();
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = (postId: string) => {
    // Navigate to post detail or open comments
    console.log('Comment on post:', postId);
  };

  const handleShare = (postId: string) => {
    // Handle sharing
    console.log('Share post:', postId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-20">
        <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No posts yet</h3>
        <p className="text-muted-foreground">Be the first to create a public post!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">Popular Posts</h2>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {posts.map((post) => (
          <UnifiedPostCard
            key={post.id}
            post={post}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
          />
        ))}
      </div>
    </div>
  );
};
