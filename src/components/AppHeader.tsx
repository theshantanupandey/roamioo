import { Link } from 'react-router-dom';
import { ArrowLeft, Bell, Settings, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNative } from '@/hooks/use-native';
import { useLocation, useNavigate } from 'react-router-dom';
export function AppHeader() {
  const {
    safeAreaClasses
  } = useNative();
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
  return <header className={`sticky top-0 z-40 w-full bg-background/90 backdrop-blur-md ${safeAreaClasses.top}`}>
      
    </header>;
}