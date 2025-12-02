'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Settings } from 'lucide-react';
import { ProfileDialog } from '@/components/features/account/profile-dialog';
import { SettingsDialog } from '@/components/features/account/settings-dialog';
import { logger } from '@/lib/utils/logger';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { config } from '@/lib/config';
import { createClient } from '@/lib/supabase/client';

export function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (e) {
        logger.error('Error loading user:', e);
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      const supabase = createClient();
      await supabase.auth.signOut();
      // Limpiar también localStorage por si acaso
      localStorage.removeItem('sb-' + config.supabase.url.split('//')[1].split('.')[0] + '-auth-token');
      router.push('/login');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return (
      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 text-sm">
        ?
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 rounded-lg hover:bg-white/5 dark:hover:bg-white/5 px-2 py-2 transition-colors">
          <Avatar className="h-9 w-9 border-2 border-orange-500/30">
            <AvatarFallback className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 text-orange-400">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
              {user.name}
              <span className={
                (user.role === 'designer')
                  ? 'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold text-blue-400 bg-blue-500/15'
                  : 'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold text-orange-400 bg-orange-500/15'
              }>
                {user.role === 'designer' ? 'Diseñador' : 'Manager'}
              </span>
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{user.email}</p>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 glass-effect border-orange-200/20 dark:border-white/10 text-gray-800 dark:text-gray-200 shadow-xl">
        <DropdownMenuLabel className="text-gray-800 dark:text-gray-200">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-orange-200/20 dark:bg-white/10" />
        <DropdownMenuItem
          onClick={() => setProfileOpen(true)}
          className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/5 dark:hover:bg-white/5 cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" />
          <span>Perfil</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setSettingsOpen(true)}
          className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/5 dark:hover:bg-white/5 cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Configuración</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-orange-200/20 dark:bg-white/10" />
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer focus:text-red-300 focus:bg-red-500/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
      
      {/* Diálogos */}
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </DropdownMenu>
  );
}

