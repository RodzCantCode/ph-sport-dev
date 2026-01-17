'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Palette, Calendar, Activity, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarLogo } from './sidebar-logo';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onClose?: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

// Navigation configuration - defined outside component to avoid recreation
const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Navegación',
    items: [
      { href: '/dashboard', label: 'Inicio', icon: Home },
      { href: '/my-week', label: 'Mi Semana', icon: Calendar },
      { href: '/designs', label: 'Diseños', icon: Palette },
      { href: '/communications', label: 'Actividad', icon: Activity },
    ],
  },
];


export function Sidebar({ collapsed, onToggle, onClose }: SidebarProps) {
  const pathname = usePathname();

  const handleLinkClick = () => {
    // Close mobile menu on link click (mobile only)
    if (typeof window !== 'undefined' && window.innerWidth < 768 && onClose) {
      onClose();
    }
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out',
        'bg-sidebar text-sidebar-foreground',
        'flex flex-col',
        collapsed ? 'w-20' : 'w-64',
        'hidden md:flex'
      )}
    >
      {/* Logo with toggle functionality */}
      <SidebarLogo collapsed={collapsed} onToggle={onToggle} />

      {/* Divider */}
      <div className="mx-4 border-b border-border" />

      {/* Navigation */}
      <nav className="flex flex-col gap-6 p-4 flex-1 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-2">
            {/* Group label - animated hide/show */}
            <div
              className={cn(
                'overflow-hidden transition-all duration-300 ease-in-out',
                collapsed ? 'max-h-0 opacity-0' : 'max-h-8 opacity-100'
              )}
            >
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-1 whitespace-nowrap">
                {group.label}
              </h3>
            </div>

            {/* Nav items */}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center rounded-lg transition-all duration-300 ease-in-out group relative',
                    'px-3 py-2.5',
                    isActive
                      ? 'bg-card text-foreground font-medium shadow-md border-l-[3px] border-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 shrink-0 transition-all duration-300',
                      // 0.0625rem (1px) offset to visually center icon when collapsed
                      // (compensates for the 3px border-l on active items)
                      collapsed && 'translate-x-[0.0625rem]',
                      isActive
                        ? 'text-primary'
                        : 'text-muted-foreground group-hover:text-foreground'
                    )}
                  />
                  <span
                    className={cn(
                      'text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out',
                      // max-w-[150px] prevents text overflow when animating
                      collapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[150px] opacity-100 ml-3'
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
