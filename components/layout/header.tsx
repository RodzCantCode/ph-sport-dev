'use client';

import { Menu, Search } from 'lucide-react';
import { UserMenu } from './user-menu';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface HeaderProps {
  onMenuClick: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
}

export function Header({ onMenuClick, searchValue = '', onSearchChange, showSearch = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-16 glass-effect-strong border-b border-orange-200/20 dark:border-white/10">
      <div className="flex h-full items-center justify-between px-4 md:px-6 gap-4">
        {/* Left: Menu button - visible on mobile */}
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-white/5 dark:hover:bg-white/5 transition-colors text-gray-600 dark:text-gray-400 hover:text-orange-400 md:hidden"
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

        {/* Center: Search bar - visible on desktop when enabled */}
        {showSearch && (
          <div className="hidden md:flex flex-1 max-w-md mx-auto">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 dark:text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar diseños, jugadores, partidos..."
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="pl-10 bg-white/5 dark:bg-white/5 border-orange-200/20 dark:border-white/10 text-gray-800 dark:text-gray-200 placeholder:text-gray-500 focus:bg-white/10 dark:focus:bg-white/10 focus:border-orange-500/50"
              />
            </div>
          </div>
        )}

        {/* Spacer for desktop when no search */}
        {!showSearch && <div className="hidden md:block flex-1" />}

        {/* Right: Theme toggle and User menu */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

