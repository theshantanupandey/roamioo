
import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface MessageIconProps {
  targetUserId?: string; // If provided, will direct message this user
  className?: string;
}

export function MessageIcon({ targetUserId, className }: MessageIconProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user && !targetUserId) {
      fetchUnreadCount();
      
      // Set up realtime subscription for unread messages
      const channel = supabase
        .channel(`unread-messages-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `recipient_id.eq.${user.id}`
          },
          () => {
            fetchUnreadCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, targetUserId]);

  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false);

      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleClick = () => {
    if (targetUserId) {
      navigate(`/messages?user=${targetUserId}`);
    } else {
      navigate('/messages');
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        className={className}
      >
        <MessageCircle className="h-5 w-5" />
      </Button>
      {!targetUserId && unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </div>
  );
}
