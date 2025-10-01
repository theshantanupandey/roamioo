
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  entity_id: string;
  entity_type: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  actor?: {
    id: string;
    username: string;
    first_name?: string;
    last_name?: string;
    profile_image_url?: string;
  };
}

export const useNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // First, fetch the activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (activitiesError) throw activitiesError;

      if (!activitiesData || activitiesData.length === 0) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      // Get unique actor IDs
      const actorIds = [...new Set(activitiesData.map(activity => activity.actor_id).filter(Boolean))];

      // Fetch actor data separately
      const { data: actorsData, error: actorsError } = await supabase
        .from('users')
        .select('id, username, first_name, last_name, profile_image_url')
        .in('id', actorIds);

      if (actorsError) throw actorsError;

      // Create a map for quick lookup
      const actorsMap = new Map(actorsData?.map(actor => [actor.id, actor]) || []);

      // Combine the data
      const notificationsWithActors = activitiesData.map(activity => ({
        ...activity,
        actor: activity.actor_id ? actorsMap.get(activity.actor_id) : undefined
      }));

      setNotifications(notificationsWithActors);
      setUnreadCount(notificationsWithActors.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('activities')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('activities')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const createNotification = async (
    userId: string,
    actorId: string,
    entityId: string,
    entityType: string,
    type: string,
    message: string
  ) => {
    try {
      const { error } = await supabase
        .from('activities')
        .insert({
          user_id: userId,
          actor_id: actorId,
          entity_id: entityId,
          entity_type: entityType,
          type: type,
          message: message
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();

      // Set up real-time subscription for new notifications
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'activities',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('New notification:', payload);
            fetchNotifications();
            
            // Show toast for new notification
            toast({
              title: "New notification",
              description: payload.new.message,
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, toast]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    createNotification
  };
};
