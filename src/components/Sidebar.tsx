
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Home,
  Compass,
  Search,
  Bell,
  MessageCircle,
  Plane,
  DollarSign,
  BookOpen,
  User,
  Settings,
  HelpCircle,
  Video,
  PlusCircle,
  Route,
  Navigation,
  MapPin,
  Languages,
  Train,
  Hotel
} from 'lucide-react';

const navigationItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Feed', href: '/feed', icon: Compass },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Activity', href: '/activity', icon: Bell },
  { name: 'Messages', href: '/messages', icon: MessageCircle },
  { name: 'Video', href: '/video', icon: Video },
];

const travellerToolsItems = [
  { name: 'Trips', href: '/trips', icon: Route },
  { name: 'Roamio Map', href: '/roamio-map', icon: MapPin },
  { name: 'Adventure Sports', href: '/adventure-sports', icon: Compass },
  { name: 'Translation', href: '/translation', icon: Languages },
  { name: 'Nearby Places', href: '/nearby-places', icon: MapPin }
];

const creativeToolsItems = [
  { name: 'Create Post', href: '/create-post', icon: PlusCircle },
  { name: 'Create Path', href: '/create-path', icon: Route },
  { name: 'Follow Path', href: '/follow-path', icon: Navigation }
];

const bottomItems = [
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Settings', href: '/account-settings', icon: Settings },
  { name: 'Help & Support', href: '/help', icon: HelpCircle }
];

export function Sidebar() {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const SidebarItem = ({ item, showBadge = false }: { item: any; showBadge?: boolean }) => (
    <Link
      to={item.href}
      className={cn(
        "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        isActive(item.href)
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      <item.icon className="h-5 w-5" />
      <span className="flex-1">{item.name}</span>
      {showBadge && (
        <Badge variant="secondary" className="ml-auto">
          3
        </Badge>
      )}
    </Link>
  );

  return (
    <div className="w-64 h-full bg-card border-r border-border flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <img 
            src="/lovable-uploads/d6d35cb2-2414-442c-b5c0-b682b1a17e3c.png" 
            alt="Roamio Logo" 
            className="h-8 w-8"
          />
          <span className="text-xl font-heading font-bold">Roamio</span>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto py-4">
        {/* Main Navigation */}
        <div className="px-3 mb-6">
          <h2 className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Navigation
          </h2>
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <SidebarItem 
                key={item.name} 
                item={item} 
                showBadge={item.name === 'Activity'} 
              />
            ))}
          </div>
        </div>

        <Separator className="mx-3 mb-6" />

        {/* Traveller Tools */}
        <div className="px-3 mb-6">
          <h2 className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Traveller Tools
          </h2>
          <div className="space-y-1">
            {travellerToolsItems.map((item) => (
              <SidebarItem key={item.name} item={item} />
            ))}
          </div>
        </div>

        <Separator className="mx-3 mb-6" />

        {/* Creative Tools */}
        <div className="px-3 mb-6">
          <h2 className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Creative Tools
          </h2>
          <div className="space-y-1">
            {creativeToolsItems.map((item) => (
              <SidebarItem key={item.name} item={item} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-border p-3">
        <div className="space-y-1">
          {bottomItems.map((item) => (
            <SidebarItem key={item.name} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
