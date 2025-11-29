import { useState, useEffect } from 'react';

export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : '';
      const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
      
      // Check for mobile devices via user agent
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const isMobileDevice = mobileRegex.test(userAgent);
      
      // Check screen width breakpoints
      const isMobileWidth = width <= 768;
      const isTabletWidth = width > 768 && width <= 1024;
      
      // Determine if mobile (either user agent or screen width)
      const mobileDetected = isMobileDevice || isMobileWidth;
      
      setIsMobile(mobileDetected);
      
      // Set device type
      if (mobileDetected) {
        setDeviceType('mobile');
      } else if (isTabletWidth) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
      
      // Mark loading as complete
      setIsLoading(false);
    };

    // Initial check
    checkDevice();

    // Add resize listener
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkDevice);
      
      // Cleanup
      return () => window.removeEventListener('resize', checkDevice);
    }
  }, []);

  return {
    isMobile,
    deviceType,
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    isLoading
  };
};

export default useMobileDetection;