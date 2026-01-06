'use client';

import { useState } from 'react';
import Image from 'next/image';

interface OrderImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

/**
 * Wrapper component for order images with better error handling and logging
 */
export function OrderImage({ src, alt, className, onClick }: OrderImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleError = () => {
    console.warn(`[OrderImage] Failed to load image: ${src}`);
    setError(true);
    setLoading(false);
  };

  const handleLoad = () => {
    console.log(`[OrderImage] Successfully loaded image: ${src}`);
    setLoading(false);
  };

  if (error) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center text-xs text-gray-500 ${className || ''}`}
        title="Failed to load image"
      >
        <span>⚠️</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${loading ? 'bg-gray-100 animate-pulse' : ''} ${className || ''}`}>
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover ${className || ''}`}
        onClick={onClick}
        onError={handleError}
        onLoad={handleLoad}
      />
    </div>
  );
}
