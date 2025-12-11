'use client';

import { Menu, Search } from 'lucide-react';
import { UserMenu } from './user-menu';
import { Input } from '@/components/ui/input';
import { NotificationsDropdown } from './notifications-dropdown';

interface HeaderProps {
  onMenuClick: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
}

export function Header({ onMenuClick, searchValue = '', onSearchChange, showSearch = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-background">
      <div className="flex h-16 items-center justify-between px-4 md:px-6 gap-4">
        {/* Left: Menu button - visible on mobile */}
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground md:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo for mobile or when sidebar is hidden */}
        <div className="flex items-center md:hidden flex-1 ml-4">
          <span className="text-lg font-bold text-primary">
            PH Sport
          </span>
        </div>

        {/* Center: Search bar - visible on desktop when enabled */}
        {showSearch && (
          <div className="hidden md:flex flex-1 max-w-md mx-auto">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar diseños, jugadores, partidos..."
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}

        {/* Spacer for desktop when no search */}
        {!showSearch && <div className="hidden md:block flex-1" />}

        {/* Right: Notifications and User menu */}
        <div className="flex items-center gap-2">
          <NotificationsDropdown />
          <UserMenu />
        </div>
      </div>
      {/* Inset divider */}
      <div className="mx-4 border-b border-border" />
    </header>
  );
}

