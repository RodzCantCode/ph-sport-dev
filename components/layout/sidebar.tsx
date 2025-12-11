'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Palette, Calendar, ChevronLeft, Activity, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-context';

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

export function Sidebar({ collapsed, onToggle, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, profile, loading } = useAuth();
  
  const handleLinkClick = () => {
    // Cerrar sidebar en mobile cuando se hace clic en un link
    if (typeof window !== 'undefined' && window.innerWidth < 768 && onClose) {
      onClose();
    }
  };

  if (loading) return null;
  if (!user) return null;
  
  // En producción estricto: Si no hay perfil, no mostramos nada
  if (!profile) return null;

  const getNavGroups = (): NavGroup[] => {
    const groups: NavGroup[] = [
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

    return groups;
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
      {/* Logo Header */}
      <div className={cn(
        'flex items-center h-16',
        collapsed ? 'justify-center px-0' : 'justify-between px-6'
      )}>
        {!collapsed ? (
          <>
            <Link href="/dashboard" className="text-xl font-bold text-foreground hover:opacity-80 transition-opacity tracking-tight">
              PH Sport
            </Link>
            <button
              onClick={onToggle}
              className="p-1.5 rounded-full hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </>
        ) : (
          <div className="relative">
            <Link href="/dashboard" className="text-xl font-bold text-primary">
              PH
            </Link>
            <button
              onClick={onToggle}
              className="absolute -right-6 top-1/2 -translate-y-1/2 p-1 rounded-full bg-card border border-border hover:bg-accent transition-colors text-muted-foreground hover:text-primary shadow-sm"
              aria-label="Expand sidebar"
            >
              <ChevronLeft className="h-3 w-3 rotate-180" />
            </button>
          </div>
        )}
      </div>
      {/* Inset divider */}
      <div className="mx-4 border-b border-border" />

      {/* Navigation */}
      <nav className="flex flex-col gap-6 p-4 flex-1 overflow-y-auto">
        {getNavGroups().map((group) => (
          <div key={group.label} className={cn("flex flex-col gap-2", collapsed && "gap-2")}>
            {!collapsed && (
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-1">
                {group.label}
              </h3>
            )}
            
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-lg transition-all duration-200 group relative',
                    collapsed ? 'px-3 py-2.5 justify-center' : 'px-4 py-2.5',
                    isActive
                      ? 'bg-card text-foreground font-medium shadow-md border-l-[3px] border-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  <Icon className={cn('h-5 w-5 shrink-0 transition-colors', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                  {!collapsed && (
                    <span className={cn('text-sm transition-opacity duration-300', collapsed ? 'opacity-0 w-0' : 'opacity-100')}>
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
