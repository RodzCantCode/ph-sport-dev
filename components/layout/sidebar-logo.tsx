'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

// Animation timing constant
const CLICK_EFFECT_DURATION_MS = 150;

// Logo paths
const LOGO_PATHS = {
  fullOrange: '/images/logo-full-orange.png',
  fullBlack: '/images/logo-full-black.png',
  iconOrange: '/images/logo-icon-orange.webp',
  iconBlack: '/images/logo-icon-black.webp',
} as const;

interface SidebarLogoProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function SidebarLogo({ collapsed, onToggle }: SidebarLogoProps) {
  const { resolvedTheme } = useTheme();
  const [isClicking, setIsClicking] = useState(false);

  const isDark = resolvedTheme === 'dark';

  const handleMouseDown = () => {
    setIsClicking(true);
  };

  const handleMouseUp = () => {
    // Minimum visible duration for click effect feedback
    setTimeout(() => {
      setIsClicking(false);
      onToggle();
    }, CLICK_EFFECT_DURATION_MS);
  };

  return (
    <div className="flex items-center h-16 px-4 transition-all duration-300 ease-in-out">
      <button
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setIsClicking(false)}
        className="relative flex items-center justify-center h-10 w-full cursor-pointer"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {/* Full logo - visible when expanded */}
        <Image
          src={LOGO_PATHS.fullOrange}
          alt="PH Sport"
          width={180}
          height={50}
          className={cn(
            'h-10 w-auto object-contain absolute left-0',
            'transition-all duration-200 ease-in-out',
            collapsed ? 'opacity-0 scale-90' : isClicking ? 'opacity-0' : 'opacity-100 scale-100'
          )}
          priority
        />
        <Image
          src={LOGO_PATHS.fullBlack}
          alt="PH Sport"
          width={180}
          height={50}
          className={cn(
            'h-10 w-auto object-contain absolute left-0',
            'transition-all duration-200 ease-in-out',
            isDark && 'invert',
            collapsed
              ? 'opacity-0 scale-90'
              : isClicking
              ? 'opacity-100 scale-95'
              : 'opacity-0 scale-100'
          )}
          priority
        />

        {/* Icon logo - visible when collapsed */}
        <Image
          src={LOGO_PATHS.iconOrange}
          alt="PH Sport"
          width={40}
          height={40}
          className={cn(
            'h-9 w-9 object-contain absolute left-1/2 -translate-x-1/2',
            'transition-all duration-200 ease-in-out',
            collapsed
              ? isClicking
                ? 'opacity-0'
                : 'opacity-100 scale-100'
              : 'opacity-0 scale-90'
          )}
          priority
        />
        <Image
          src={LOGO_PATHS.iconBlack}
          alt="PH Sport"
          width={40}
          height={40}
          className={cn(
            'h-9 w-9 object-contain absolute left-1/2 -translate-x-1/2',
            'transition-all duration-200 ease-in-out',
            isDark && 'invert',
            collapsed ? (isClicking ? 'opacity-100 scale-95' : 'opacity-0') : 'opacity-0 scale-90'
          )}
          priority
        />
      </button>
    </div>
  );
}
