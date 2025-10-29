'use client';

import { Menu } from 'lucide-react';
import { UserMenu } from './user-menu';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-16 glass-effect-strong border-b border-white/10">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        {/* Left: Menu button - visible on mobile */}
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-orange-400 md:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo for mobile or when sidebar is hidden */}
        <div className="flex items-center md:hidden flex-1 ml-4">
          <span className="text-lg font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
            PH Sport
          </span>
        </div>

        {/* Spacer for desktop */}
        <div className="hidden md:block flex-1" />

        {/* Right: User menu */}
        <div className="flex items-center gap-4">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

