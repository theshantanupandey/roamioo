
import React from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationBadgeProps {
  className?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ className = "" }) => {
  const { unreadCount } = useNotifications();

  return (
    <div className={`relative ${className}`}>
      <Bell className="h-6 w-6" />
      {unreadCount > 0 && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}
    </div>
  );
};
