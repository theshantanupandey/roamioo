import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UnifiedPostCard } from '@/components/UnifiedPostCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

const PostDetail = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    if (postId) {
      fetchPost();
      if (user) {
        checkIfLiked();
      }
    }
  }, [postId, user]);

  const fetchPost = async () => {
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
        .eq('id', postId)
        .single();

      if (error) throw error;
      setPost(data);
    } catch (error) {
      console.error('Error fetching post:', error);
      toast({
        title: 'Error',
        description: 'Failed to load post',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const checkIfLiked = async () => {
    if (!user || !postId) return;

    try {
      const { data, error } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error) {
        setHasLiked(!!data);
      }
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please log in to like posts',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (hasLiked) {
        // Unlike
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        setHasLiked(false);
      } else {
        // Like
        await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: user.id });
        setHasLiked(true);
      }
      
      // Refresh post to get updated counts
      fetchPost();
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: 'Error',
        description: 'Failed to update like',
        variant: 'destructive',
      });
    }
  };

  const handleComment = (postId: string) => {
    // Scroll to comments section or open comments modal
    console.log('Open comments for post:', postId);
  };

  const handleShare = (postId: string) => {
    // Handle sharing
    if (navigator.share) {
      navigator.share({
        title: 'Check out this post',
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link copied',
        description: 'Post link copied to clipboard',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h2 className="text-xl font-semibold">Post not found</h2>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Post</h1>
      </div>

      {/* Post Content */}
      <div className="max-w-2xl mx-auto">
        <UnifiedPostCard
          post={{ ...post, has_liked: hasLiked }}
          onLike={handleLike}
          onComment={handleComment}
          onShare={handleShare}
        />
      </div>
    </div>
  );
};

export default PostDetail;
