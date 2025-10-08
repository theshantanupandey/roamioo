
import { Link } from 'react-router-dom';
import { ArrowLeft, Bell, Settings, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNative } from '@/hooks/use-native';
import { useLocation, useNavigate } from 'react-router-dom';

export function AppHeader() {
  const { safeAreaClasses } = useNative();
  const location = useLocation();
  const navigate = useNavigate();

  // Hide header on messaging pages since they have their own headers
  const isMessagingPage = location.pathname === '/messages' || location.pathname.startsWith('/messages');
  
  if (isMessagingPage) {
    return null;
  }

  // Check if we're on a sub-page (not home, trips, expenses, profile, feed, discover)
  const isSubPage = !['/', '/trips', '/expenses', '/profile', '/feed', '/discover'].includes(location.pathname);
  // Check if we're on the profile page
  const isProfilePage = location.pathname === '/profile';
  
  const handleBack = () => {
    navigate(-1);
  };

  const handleNotificationClick = () => {
    navigate('/activity');
  };

  const handleSettingsClick = () => {
    navigate('/account-settings');
  };

  return (
    <header className={`sticky top-0 z-40 w-full bg-background/90 backdrop-blur-md ${safeAreaClasses.top}`}>
      <div className="px-4 h-14 flex items-center justify-between">
        {isSubPage ? (
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={handleBack} className="mr-2 h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-heading font-semibold">
              {location.pathname.includes('new') ? 'New Trip' : 'Details'}
            </h1>
          </div>
        ) : isProfilePage ? (
          <div></div> // Empty div for profile page to align right items correctly
        ) : (
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/d6d35cb2-2414-442c-b5c0-b682b1a17e3c.png" 
              alt="Roamio Logo" 
              className="h-8 w-8"
            />
            <span className="text-lg font-heading font-semibold">
              Roamio
            </span>
          </Link>
        )}

        <div className="flex items-center gap-2">
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-9 w-9 text-muted-foreground rounded-full"
            onClick={handleNotificationClick}
          >
            <Bell className="h-5 w-5" />
          </Button>
          {location.pathname === '/profile' && (
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-9 w-9 text-muted-foreground rounded-full" 
              onClick={handleSettingsClick}
            >
              <Settings className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
