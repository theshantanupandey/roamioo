import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, TrendingUp, Play } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AspectRatio } from '@/components/ui/aspect-ratio';

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
  const navigate = useNavigate();

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

  const handlePostClick = (postId: string) => {
    navigate(`/post/${postId}`);
  };

  const getPostThumbnail = (post: Post) => {
    if (post.video_url) {
      return post.video_url;
    }
    if (post.image_urls && post.image_urls.length > 0) {
      return post.image_urls[0];
    }
    return null;
  };

  const isVideoPost = (post: Post) => {
    return !!post.video_url;
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
        <h2 className="text-xl font-bold">Explore</h2>
      </div>
      
      {/* Instagram-style 3-column grid */}
      <div className="grid grid-cols-3 gap-1">
        {posts.map((post) => {
          const thumbnail = getPostThumbnail(post);
          const hasVideo = isVideoPost(post);
          
          return (
            <div
              key={post.id}
              className="relative cursor-pointer group overflow-hidden"
              onClick={() => handlePostClick(post.id)}
            >
              <AspectRatio ratio={1}>
                {thumbnail ? (
                  <>
                    {hasVideo ? (
                      <div className="relative w-full h-full">
                        <video
                          src={thumbnail}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                        <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1">
                          <Play className="h-4 w-4 text-white fill-white" />
                        </div>
                      </div>
                    ) : (
                      <img
                        src={thumbnail}
                        alt="Post"
                        className="w-full h-full object-cover"
                      />
                    )}
                    
                    {/* Hover overlay with stats */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                      <div className="flex items-center gap-1">
                        <svg className="h-5 w-5 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                        <span className="font-semibold">{post.likes_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="h-5 w-5 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                        </svg>
                        <span className="font-semibold">{post.comments_count}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <p className="text-xs text-muted-foreground text-center p-2 line-clamp-3">
                      {post.content}
                    </p>
                  </div>
                )}
              </AspectRatio>
            </div>
          );
        })}
      </div>
    </div>
  );
};
