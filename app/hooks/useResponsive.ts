"use client";

import { useState, useEffect } from 'react';

/**
 * Professional responsive design hook
 * Provides screen size information for responsive components
 * 
 * Usage:
 * const { isMobile, isTablet, isDesktop, screenSize, mounted } = useResponsive();
 */

export type ScreenSize = 'mobile' | 'tablet' | 'desktop';

interface ResponsiveState {
  isMobile: boolean;      // < 768px (sm)
  isTablet: boolean;      // 768px - 1024px (md to lg)
  isDesktop: boolean;     // >= 1024px
  screenSize: ScreenSize;
  width: number;
  mounted: boolean;       // Prevents hydration mismatch
}

const BREAKPOINTS = {
  mobile: 768,    // < 768px
  tablet: 1024,   // 768px - 1024px
  desktop: 1024,  // >= 1024px
};

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenSize: 'desktop',
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    mounted: false,
  });

  useEffect(() => {
    // Set mounted flag immediately to prevent hydration mismatch
    setState(prev => ({ ...prev, mounted: true }));

    const handleResize = () => {
      const width = window.innerWidth;
      const isMobile = width < BREAKPOINTS.mobile;
      const isTablet = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;
      const isDesktop = width >= BREAKPOINTS.desktop;

      setState({
        isMobile,
        isTablet,
        isDesktop,
        screenSize: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
        width,
        mounted: true,
      });
    };

    // Call once on mount
    handleResize();

    // Add listener for window resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return state;
}
