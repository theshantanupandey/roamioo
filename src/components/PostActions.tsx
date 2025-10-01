import React, { useState } from 'react';
import { MoreHorizontal, Trash2, Edit, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PostActionsProps {
  postId: string;
  postUserId: string;
  imageUrls?: string[];
  currentContent?: string;
  onPostDeleted: (postId: string) => void;
  onPostUpdated?: (postId: string, newContent: string) => void;
  tripId?: string; // added tripId as optional prop in the main interface
}

export const PostActions = ({
  postId,
  postUserId,
  imageUrls,
  currentContent = '',
  onPostDeleted,
  onPostUpdated,
  tripId,
}: PostActionsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editContent, setEditContent] = useState(currentContent);

  // Only show actions if the current user owns the post OR if tripId is present for navigation
  if (!user || (user.id !== postUserId && !tripId)) {
    return null;
  }

  const handleDeletePost = async () => {
    if (!user) return;

    setIsDeleting(true);

    try {
      // Delete images from storage if they exist
      if (imageUrls && imageUrls.length > 0) {
        for (const imageUrl of imageUrls) {
          // Extract file path from URL
          const urlParts = imageUrl.split('/');
          const bucketIndex = urlParts.findIndex((part) => part === 'posts');
          if (bucketIndex !== -1) {
            const filePath = urlParts.slice(bucketIndex + 1).join('/');
            await supabase.storage.from('posts').remove([filePath]);
          }
        }
      }

      // Delete post from database
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Post deleted',
        description: 'Your post has been deleted successfully.',
      });

      onPostDeleted(postId);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete post. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditPost = async () => {
    if (!user || !editContent.trim()) return;

    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from('posts')
        .update({
          content: editContent.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Post updated',
        description: 'Your post has been updated successfully.',
      });

      onPostUpdated?.(postId, editContent.trim());
      setShowEditDialog(false);
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: 'Error',
        description: 'Failed to update post. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* Trip Details: always first if there is a tripId */}
          {tripId && (
            <DropdownMenuItem asChild>
              <a
                href={`/trips/${tripId}`}
                className="flex items-center"
                tabIndex={0}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Trip Details
              </a>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => {
              setEditContent(currentContent);
              setShowEditDialog(true);
            }}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Post
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Post
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
            <DialogDescription>
              Make changes to your post caption.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="What's on your mind?"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditPost}
              disabled={isUpdating || !editContent.trim()}
            >
              {isUpdating ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
