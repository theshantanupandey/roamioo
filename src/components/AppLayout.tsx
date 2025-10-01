
import React from 'react';
import { AppHeader } from './AppHeader';
import { BottomNavigation } from './BottomNavigation';
import { Sidebar } from './Sidebar';
import { Toaster } from '@/components/ui/toaster';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useState, useRef } from 'react';
import { useNative } from '@/hooks/use-native';
import { useDevice } from '@/hooks/use-device';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [mounted, setMounted] = useState(false);
  const { isNative, safeAreaClasses } = useNative();
  const { isDesktop, isTablet, isMobile } = useDevice();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const [isPulling, setPulling] = useState(false);
  const touchStartY = useRef(0);

  // Ensure components are mounted only on client-side
  useEffect(() => {
    setMounted(true);
    
    // Fix viewport height issues on mobile
    const fixViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    fixViewportHeight();
    window.addEventListener('resize', fixViewportHeight);
    
    return () => {
      window.removeEventListener('resize', fixViewportHeight);
    };
  }, []);

  // Handle water navigation effect
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollAreaRef.current) return;
      
      const currentScrollY = scrollAreaRef.current.scrollTop;
      lastScrollY.current = currentScrollY;
    };
    
    const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll, { passive: true });
      
      return () => {
        scrollElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, [mounted]);

  // Touch handlers for pull-to-refresh
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    const touchY = e.touches[0].clientY;
    const scrollTop = scrollAreaRef.current?.scrollTop || 0;
    
    // Only trigger pull effect when at the top of the content
    if (scrollTop <= 0 && touchY > touchStartY.current) {
      const pullDistance = touchY - touchStartY.current;
      if (pullDistance > 50) {
        setPulling(true);
      }
    }
  };
  
  const handleTouchEnd = () => {
    if (isPulling) {
      // This is where you'd trigger a refresh
      setTimeout(() => {
        setPulling(false);
      }, 800);
    }
  };

  // Desktop specific styles - updated for a more app-like experience
  const desktopStyles = isDesktop ? 
    'w-full max-w-[1600px] mx-auto bg-background' : 
    (isNative ? '' : (isTablet ? 'max-w-screen-tablet mx-auto md:rounded-xl md:my-4 md:shadow-xl md:overflow-hidden' : 'max-w-md mx-auto md:rounded-xl md:my-4 md:shadow-xl md:overflow-hidden'));

  return (
    <div className={`flex flex-col md:flex-row h-[100vh] h-[calc(var(--vh,1vh)*100)] ${desktopStyles}`}>
      {/* Show sidebar for tablet and desktop */}
      {(isTablet || isDesktop) && <Sidebar />}
      
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        <AppHeader />
        
        <ScrollArea 
          ref={scrollAreaRef}
          className={`flex-1 w-full overflow-hidden water-navigation ${safeAreaClasses.top}`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className={`pb-24 md:pb-8 animate-fade-in ${isPulling ? 'pulling' : ''} ${isDesktop ? 'desktop-content' : ''}`}>
            {isPulling && (
              <div className="pull-indicator flex justify-center py-4">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Refreshing</span>
              </div>
            )}
            {mounted && children}
          </div>
        </ScrollArea>
        
        {/* Only show bottom navigation on mobile */}
        {isMobile && <BottomNavigation />}
        <Toaster />
      </div>
    </div>
  );
}
