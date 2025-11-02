'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Palette, Calendar, LogOut, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCurrentUser, isAdminOrManager } from '@/lib/auth/get-current-user';

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

const navItemsDesigner: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/my-week', label: 'Mi Semana', icon: Calendar },
  { href: '/designs', label: 'Diseños', icon: Palette },
];

const navItemsManager: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/designs', label: 'Diseños', icon: Palette },
  { href: '/my-week', label: 'Mi Semana', icon: Calendar },
];

export function Sidebar({ collapsed, onToggle, onClose }: SidebarProps) {
  const pathname = usePathname();
  
  const handleLinkClick = () => {
    // Cerrar sidebar en mobile cuando se hace clic en un link
    if (typeof window !== 'undefined' && window.innerWidth < 768 && onClose) {
      onClose();
    }
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen glass-effect-strong border-r border-white/10 transition-all duration-300 ease-in-out',
        'flex flex-col',
        collapsed ? 'w-20' : 'w-64',
        'hidden md:flex' // Solo oculto en mobile cuando no está en overlay mode
      )}
    >
      {/* Logo/Header */}
      <div className={cn('flex h-16 items-center border-b border-white/10 relative', collapsed ? 'justify-center px-0' : 'justify-between px-4')}>
        {!collapsed ? (
          <>
            <Link href="/dashboard" className="text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
              PH Sport
            </Link>
            <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-orange-400"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-5 w-5 transition-transform duration-300" />
            </button>
          </>
        ) : (
          <>
            <Link href="/dashboard" className="text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
              PH
            </Link>
            <button
              onClick={onToggle}
              className="absolute -right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full glass-effect border border-white/10 hover:bg-white/10 transition-colors text-gray-400 hover:text-orange-400 shadow-lg"
              aria-label="Expand sidebar"
            >
              <ChevronLeft className="h-4 w-4 rotate-180" />
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-4">
        {(() => {
          const user = typeof window !== 'undefined' ? getCurrentUser() : null;
          const items = isAdminOrManager(user) ? navItemsManager : navItemsDesigner;
          return items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
 
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-3 rounded-lg transition-all duration-200 group',
                  collapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3',
                  isActive
                    ? 'bg-gradient-to-r from-orange-500/20 to-orange-600/20 text-orange-400 border-l-2 border-orange-500 shadow-sm shadow-orange-500/10'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                )}
              >
                <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-orange-400' : 'text-gray-400 group-hover:text-orange-400 transition-colors')} />
                {!collapsed && (
                  <span className={cn('text-sm font-medium transition-opacity duration-300', collapsed ? 'opacity-0 w-0' : 'opacity-100')}>
                    {item.label}
                  </span>
                )}
              </Link>
            );
          });
        })()}

        {/* Separator */}
        <div className="my-4 h-px bg-white/10" />

        {/* Logout */}
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('user');
              window.location.href = '/login';
            }
          }}
          className={cn(
            'flex items-center gap-3 rounded-lg transition-all duration-200 text-gray-400 hover:text-red-400 hover:bg-red-500/10',
            collapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3'
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span className={cn('text-sm font-medium transition-opacity duration-300', collapsed ? 'opacity-0 w-0' : 'opacity-100')}>Cerrar Sesión</span>}
        </button>
      </nav>
    </aside>
  );
}

