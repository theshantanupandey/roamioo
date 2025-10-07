
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Map, Search, User, Grid, Plus, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNative } from '@/hooks/use-native';

export function BottomNavigation() {
  const { safeAreaClasses } = useNative();
  const location = useLocation();

  // Hide bottom navigation on messaging pages and Roamio map
  const isMessagingPage = location.pathname === '/messages' || location.pathname.startsWith('/messages');
  const isRoamioMap = location.pathname === '/roamio-map';
  
  if (isMessagingPage || isRoamioMap) {
    return null;
  }

  // Check if we're in the feed section to show different navigation
  const isFeedSection = ['/feed', '/search', '/video', '/profile', '/create-post'].includes(location.pathname);
  
  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border z-50", 
      safeAreaClasses.bottom
    )}>
      <div className="h-16 flex items-center justify-around px-4 mx-auto max-w-md">
        {!isFeedSection ? (
          // Default navigation: Home, Trips, Feed, Profile
          <>
            <NavTab to="/" icon={<Home className="w-6 h-6" />} />
            <NavTab to="/trips" icon={<Map className="w-6 h-6" />} />
            <NavTab to="/feed" icon={<Grid className="w-6 h-6" />} />
            <NavTab to="/profile" icon={<User className="w-6 h-6" />} />
          </>
        ) : (
          // Feed section navigation: Grid, Search, Create, Video, Profile
          <>
            <NavTab to="/feed" icon={<Grid className="w-6 h-6" />} />
            <NavTab to="/search" icon={<Search className="w-6 h-6" />} />
            <NavTab 
              to="/create-post" 
              icon={<Plus className="w-6 h-6" />}
            />
            <NavTab to="/video" icon={<Video className="w-6 h-6" />} />
            <NavTab to="/profile" icon={<User className="w-6 h-6" />} />
          </>
        )}
      </div>
    </div>
  );
}

interface NavTabProps {
  to: string;
  icon: React.ReactNode;
  label?: string;
  className?: string;
  activeClassName?: string;
}

function NavTab({ to, icon, label, className, activeClassName }: NavTabProps) {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => cn(
        "flex flex-col items-center justify-center transition-colors", 
        isActive 
          ? activeClassName || "text-[#95C11F]" 
          : "text-gray-400 hover:text-gray-600",
        className
      )}
    >
      <div className="flex items-center justify-center">
        {icon}
      </div>
      {label && <span className="text-xs mt-1">{label}</span>}
    </NavLink>
  );
}
