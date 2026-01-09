'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Palette, Calendar, Activity, Home } from 'lucide-react';
import { useTheme } from 'next-themes';
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
  const { resolvedTheme } = useTheme();
  const [isClicking, setIsClicking] = useState(false);

  const handleLinkClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768 && onClose) {
      onClose();
    }
  };

  const handleLogoMouseDown = () => {
    setIsClicking(true);
  };

  const handleLogoMouseUp = () => {
    setTimeout(() => {
      setIsClicking(false);
      onToggle();
    }, 150);
  };

  if (loading) return null;
  if (!user) return null;
  if (!profile) return null;

  const isDark = resolvedTheme === 'dark';

  // Logos: naranja por defecto, negro/blanco para efecto click
  const logoFullOrange = '/images/logo-full-orange.png';
  const logoFullAlt = '/images/logo-full-black.png';
  const logoIconOrange = '/images/logo-icon-orange.webp';
  const logoIconAlt = '/images/logo-icon-black.webp';

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
      {/* Logo Header - click para toggle con efecto de color */}
      <div className="flex items-center h-16 px-4 transition-all duration-300 ease-in-out">
        <button
          onMouseDown={handleLogoMouseDown}
          onMouseUp={handleLogoMouseUp}
          onMouseLeave={() => setIsClicking(false)}
          className="relative flex items-center justify-center h-10 w-full cursor-pointer"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {/* Logo completo - visible cuando expandido */}
          <Image
            src={logoFullOrange}
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
            src={logoFullAlt}
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

          {/* Logo icono - visible cuando colapsado */}
          <Image
            src={logoIconOrange}
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
            src={logoIconAlt}
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

      {/* Inset divider */}
      <div className="mx-4 border-b border-border" />

      {/* Navigation - ORIGINAL sin cambios */}
      <nav className="flex flex-col gap-6 p-4 flex-1 overflow-y-auto">
        {getNavGroups().map((group) => (
          <div key={group.label} className="flex flex-col gap-2">
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
                      collapsed && 'translate-x-[0.0625rem]',
                      isActive
                        ? 'text-primary'
                        : 'text-muted-foreground group-hover:text-foreground'
                    )}
                  />
                  <span
                    className={cn(
                      'text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out',
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
