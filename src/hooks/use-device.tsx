
import { useState, useEffect } from 'react';

type DeviceType = 'mobile' | 'tablet' | 'desktop';

export function useDevice() {
  const [deviceType, setDeviceType] = useState<DeviceType>('mobile');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setDeviceType('desktop');
      } else if (width >= 640) {
        setDeviceType('tablet');
      } else {
        setDeviceType('mobile');
      }
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'tablet';
  const isDesktop = deviceType === 'desktop';

  return { deviceType, isMobile, isTablet, isDesktop };
}
