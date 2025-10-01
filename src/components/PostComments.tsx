import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageSquare, MoreHorizontal, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotificationTriggers } from '@/hooks/useNotificationTriggers';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_comment_id?: string;
  likes_count: number;
  user?: {
    id: string;
    username: string;
    first_name?: string;
    last_name?: string;
    profile_image_url?: string;
  };
  has_liked?: boolean;
  replies?: Comment[];
}

interface PostCommentsProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PostComments = ({ postId, isOpen, onClose }: PostCommentsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { triggerCommentNotification, triggerLikeNotification } = useNotificationTriggers();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && postId) {
      fetchComments();
    }
  }, [isOpen, postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      
      // Fetch comments with user data
      const { data: commentsData, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          users:user_id (id, username, first_name, last_name, profile_image_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Check which comments the current user has liked
      const { data: userLikes } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', user?.id || '');

      const likedCommentIds = userLikes?.map(like => like.comment_id) || [];

      // Organize comments into a tree structure
      const commentsWithLikes = commentsData?.map(comment => ({
        ...comment,
        user: comment.users,
        has_liked: likedCommentIds.includes(comment.id),
        replies: []
      })) || [];

      // Separate top-level comments and replies
      const topLevelComments: Comment[] = [];
      const replies: Comment[] = [];

      commentsWithLikes.forEach(comment => {
        if (comment.parent_comment_id) {
          replies.push(comment);
        } else {
          topLevelComments.push(comment);
        }
      });

      // Add replies to their parent comments
      replies.forEach(reply => {
        const parentComment = topLevelComments.find(c => c.id === reply.parent_comment_id);
        if (parentComment) {
          if (!parentComment.replies) parentComment.replies = [];
          parentComment.replies.push(reply);
        }
      });

      setComments(topLevelComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;

    try {
      const { data: newCommentData, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment.trim(),
          parent_comment_id: replyTo
        })
        .select()
        .single();

      if (error) throw error;

      // Get post owner for notification
      const { data: postData } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      if (postData) {
        await triggerCommentNotification(postId, postData.user_id);
      }

      // Refresh the page or parent component to show updated comment count
      if (window.location.pathname.includes('/feed') || window.location.pathname.includes('/profile')) {
        window.location.reload();
      }

      setNewComment('');
      setReplyTo(null);
      fetchComments();
      
      toast({
        title: "Comment posted",
        description: "Your comment has been added successfully."
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive"
      });
    }
  };

  const handleLikeComment = async (commentId: string, isLiked: boolean) => {
    if (!user) return;

    try {
      if (isLiked) {
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('comment_likes')
          .insert({ comment_id: commentId, user_id: user.id });

        // Find comment owner for notification
        const comment = comments.find(c => c.id === commentId) || 
                      comments.find(c => c.replies?.find(r => r.id === commentId))?.replies?.find(r => r.id === commentId);
        
        if (comment && comment.user_id !== user.id) {
          await supabase.from('activities').insert({
            user_id: comment.user_id,
            actor_id: user.id,
            entity_id: commentId,
            entity_type: 'comment',
            type: 'comment_liked',
            message: `${user.user_metadata?.first_name || user.email} liked your comment`
          });
        }
      }

      // Update local state
      setComments(comments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            has_liked: !isLiked,
            likes_count: isLiked ? comment.likes_count - 1 : comment.likes_count + 1
          };
        }
        if (comment.replies) {
          comment.replies = comment.replies.map(reply => {
            if (reply.id === commentId) {
              return {
                ...reply,
                has_liked: !isLiked,
                likes_count: isLiked ? reply.likes_count - 1 : reply.likes_count + 1
              };
            }
            return reply;
          });
        }
        return comment;
      }));
    } catch (error) {
      console.error('Error liking comment:', error);
      toast({
        title: "Error",
        description: "Failed to like comment",
        variant: "destructive"
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    
    try {
      // Delete the comment from the database
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id); // Ensure only the comment owner can delete it
      
      if (error) throw error;
      
      // Refresh the page or parent component to show updated comment count
      if (window.location.pathname.includes('/feed') || window.location.pathname.includes('/profile')) {
        window.location.reload();
      }
      
      // Update local state by removing the deleted comment
      setComments(comments.filter(comment => {
        // Remove the comment if it matches the deleted ID
        if (comment.id === commentId) return false;
        
        // If the comment has replies, filter out any replies that match the deleted ID
        if (comment.replies) {
          comment.replies = comment.replies.filter(reply => reply.id !== commentId);
        }
        
        return true;
      }));
      
      toast({
        title: "Comment deleted",
        description: "Your comment has been removed successfully."
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete comment",
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

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`flex space-x-3 ${isReply ? 'ml-8 sm:ml-12 mt-2' : 'mb-4'}`}>
      <div 
        className="cursor-pointer"
        onClick={() => window.location.href = `/profile/${comment.user_id}`}
      >
        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 hover:opacity-80 transition-opacity">
          <AvatarImage src={comment.user?.profile_image_url} />
          <AvatarFallback>{getInitials(comment.user)}</AvatarFallback>
        </Avatar>
      </div>
      
      <div className="flex-1">
        <div className="bg-muted rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between mb-1">
            <span 
              className="font-medium text-sm sm:text-base cursor-pointer hover:text-primary transition-colors"
              onClick={() => window.location.href = `/profile/${comment.user_id}`}
            >
              {formatUsername(comment.user)}
            </span>
            {user?.id === comment.user_id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => handleDeleteComment(comment.id)}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <p className="text-sm sm:text-base">{comment.content}</p>
        </div>
        
        <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
          <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
          
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 px-2 ${comment.has_liked ? 'text-red-500' : ''}`}
            onClick={() => handleLikeComment(comment.id, !!comment.has_liked)}
          >
            <Heart className={`h-3 w-3 mr-1 ${comment.has_liked ? 'fill-current' : ''}`} />
            {comment.likes_count}
          </Button>
          
          {!isReply && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={() => setReplyTo(comment.id)}
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              Reply
            </Button>
          )}
        </div>
        
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} isReply={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex sm:items-center items-end justify-center z-50">
      <div className="bg-background w-full sm:w-full md:w-2/3 lg:w-1/2 max-h-[90vh] sm:max-h-[75vh] sm:rounded-lg rounded-t-lg flex flex-col mb-16 sm:mb-0">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <h3 className="font-semibold text-base sm:text-lg">Comments</h3>
          <Button variant="ghost" size="sm" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full" onClick={onClose}>
            ×
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center text-muted-foreground">Loading comments...</div>
          ) : comments.length > 0 ? (
            comments.map(comment => (
              <CommentItem key={comment.id} comment={comment} />
            ))
          ) : (
            <div className="text-center text-muted-foreground">No comments yet</div>
          )}
        </div>
        
        <div className="p-4 sm:p-6 border-t">
          {replyTo && (
            <div className="mb-2 text-sm sm:text-base text-muted-foreground flex items-center">
              <span>Replying to comment</span>
              <Button variant="ghost" size="sm" className="ml-2" onClick={() => setReplyTo(null)}>
                Cancel
              </Button>
            </div>
          )}
          
          <div className="flex space-x-2 sm:space-x-3">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="resize-none sm:text-base"
              rows={2}
            />
            <Button 
              onClick={handleSubmitComment} 
              disabled={!newComment.trim()}
              className="sm:px-6"
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
