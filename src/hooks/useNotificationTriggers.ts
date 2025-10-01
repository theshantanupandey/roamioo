
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useNotificationTriggers = () => {
  const { user } = useAuth();

  const triggerLikeNotification = async (postId: string, postOwnerId: string) => {
    if (!user || user.id === postOwnerId) return; // Don't notify self

    try {
      // Use the notification manager edge function for delayed notifications
      await supabase.functions.invoke('notification-manager', {
        body: {
          action: 'schedule_like_notification',
          data: {
            postId,
            postOwnerId,
            actorId: user.id,
            actorName: user.user_metadata?.first_name || user.email
          }
        }
      });
    } catch (error) {
      console.error('Error scheduling like notification:', error);
    }
  };

  const removeLikeNotification = async (postId: string) => {
    if (!user) return;

    try {
      // Remove the notification immediately when unliked
      await supabase.functions.invoke('notification-manager', {
        body: {
          action: 'remove_like_notification',
          data: {
            postId,
            actorId: user.id
          }
        }
      });
    } catch (error) {
      console.error('Error removing like notification:', error);
    }
  };

  const triggerCommentNotification = async (postId: string, postOwnerId: string) => {
    if (!user || user.id === postOwnerId) return; // Don't notify self

    try {
      // Use the notification manager edge function for delayed notifications
      await supabase.functions.invoke('notification-manager', {
        body: {
          action: 'schedule_comment_notification',
          data: {
            postId,
            postOwnerId,
            actorId: user.id,
            actorName: user.user_metadata?.first_name || user.email
          }
        }
      });
    } catch (error) {
      console.error('Error scheduling comment notification:', error);
    }
  };

  const triggerFollowNotification = async (followedUserId: string) => {
    if (!user || user.id === followedUserId) return; // Don't notify self

    try {
      // Use the notification manager edge function for delayed notifications
      await supabase.functions.invoke('notification-manager', {
        body: {
          action: 'schedule_follow_notification',
          data: {
            followedUserId,
            actorId: user.id,
            actorName: user.user_metadata?.first_name || user.email
          }
        }
      });
    } catch (error) {
      console.error('Error scheduling follow notification:', error);
    }
  };

  const removeFollowNotification = async (followedUserId: string) => {
    if (!user) return;

    try {
      // Remove the notification immediately when unfollowed
      await supabase.functions.invoke('notification-manager', {
        body: {
          action: 'remove_follow_notification',
          data: {
            followedUserId,
            actorId: user.id
          }
        }
      });
    } catch (error) {
      console.error('Error removing follow notification:', error);
    }
  };

  const triggerTripJoinNotification = async (tripId: string, tripOwnerId: string) => {
    if (!user || user.id === tripOwnerId) return; // Don't notify self

    try {
      await supabase.from('activities').insert({
        user_id: tripOwnerId,
        actor_id: user.id,
        entity_id: tripId,
        entity_type: 'trip',
        type: 'trip_join_request',
        message: `${user.user_metadata?.first_name || user.email} requested to join your trip`
      });
    } catch (error) {
      console.error('Error creating trip join notification:', error);
    }
  };

  return {
    triggerLikeNotification,
    removeLikeNotification,
    triggerCommentNotification,
    triggerFollowNotification,
    removeFollowNotification,
    triggerTripJoinNotification
  };
};
