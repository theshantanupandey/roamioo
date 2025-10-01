
import { useEffect, useState } from 'react';
import { nativeService } from '../services/NativeService';
import { ScrollArea } from '@/components/ui/scroll-area';

export function useNative() {
  const [isNative] = useState(nativeService.isNativeApp());
  const [platform] = useState(nativeService.getPlatform());
  const [safeAreaClasses] = useState(nativeService.getSafeAreaClasses());
  const [isScrolling, setIsScrolling] = useState(false);
  
  // Configure water navigation effect
  const configureWaterNavigation = (element: HTMLElement | null) => {
    if (!element) return;
    
    element.classList.add('water-navigation');
    
    let startY = 0;
    let isPulling = false;
    
    const touchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      if (element.scrollTop === 0) {
        element.classList.add('at-top');
      }
    };
    
    const touchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY;
      
      if (element.classList.contains('at-top') && diff > 30) {
        if (!isPulling) {
          isPulling = true;
          element.classList.add('pulling');
        }
      }
    };
    
    const touchEnd = () => {
      if (isPulling) {
        isPulling = false;
        element.classList.remove('pulling');
      }
      element.classList.remove('at-top');
    };
    
    element.addEventListener('touchstart', touchStart);
    element.addEventListener('touchmove', touchMove);
    element.addEventListener('touchend', touchEnd);
    
    return () => {
      element.removeEventListener('touchstart', touchStart);
      element.removeEventListener('touchmove', touchMove);
      element.removeEventListener('touchend', touchEnd);
    };
  };
  
  useEffect(() => {
    // Apply class to body when in native mode
    if (isNative) {
      document.body.classList.add('is-native-app');
      
      // Add viewport meta tag for mobile
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no';
      document.head.appendChild(meta);
      
      // Find scroll containers and apply water navigation
      const scrollAreas = document.querySelectorAll('.water-navigation');
      scrollAreas.forEach((area) => configureWaterNavigation(area as HTMLElement));
      
      return () => {
        document.body.classList.remove('is-native-app');
        document.head.removeChild(meta);
      };
    }
  }, [isNative]);
  
  return {
    isNative,
    platform,
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
    safeAreaClasses,
    isScrolling,
    setIsScrolling,
    configureWaterNavigation,
  };
}
