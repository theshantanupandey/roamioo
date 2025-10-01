
import React from 'react';
import { Bell, Heart, MessageSquare, UserPlus, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '@/hooks/useNotifications';
import { Skeleton } from '@/components/ui/skeleton';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'post_liked':
    case 'comment_liked':
      return <Heart className="h-5 w-5 text-red-500" />;
    case 'post_commented':
      return <MessageSquare className="h-5 w-5 text-blue-500" />;
    case 'user_followed':
      return <UserPlus className="h-5 w-5 text-green-500" />;
    case 'trip_joined':
    case 'trip_join_request':
    case 'participant_joined':
      return <MapPin className="h-5 w-5 text-purple-500" />;
    default:
      return <Bell className="h-5 w-5 text-gray-500" />;
  }
};

const getInitials = (user: any) => {
  if (!user) return 'U';
  if (user.first_name && user.last_name) {
    return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  }
  return user.username?.substring(0, 2).toUpperCase() || 'U';
};

export default function Notifications() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Notifications</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
            <p className="text-muted-foreground">
              When someone likes your posts or follows you, you'll see it here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`cursor-pointer transition-colors bg-card border-border ${
                !notification.is_read ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800' : ''
              }`}
              onClick={() => !notification.is_read && markAsRead(notification.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div 
                    className="cursor-pointer"
                    onClick={() => notification.actor_id && (window.location.href = `/profile/${notification.actor_id}`)}
                  >
                    <Avatar className="h-12 w-12 hover:opacity-80 transition-opacity">
                      <AvatarImage 
                        src={notification.actor?.profile_image_url} 
                        alt={notification.actor?.username || 'User'} 
                      />
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        {getInitials(notification.actor)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {getNotificationIcon(notification.type)}
                    <p className="text-sm font-medium text-card-foreground">
                        <span 
                          className="font-semibold cursor-pointer hover:text-primary transition-colors"
                          onClick={() => notification.actor_id && (window.location.href = `/profile/${notification.actor_id}`)}
                        >
                          {notification.actor?.first_name && notification.actor?.last_name 
                            ? `${notification.actor.first_name} ${notification.actor.last_name}` 
                            : notification.actor?.username || 'Someone'}
                        </span>
                        {' '}
                        {notification.message.replace(/^\S+\s/, '')}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  
                  {!notification.is_read && (
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
