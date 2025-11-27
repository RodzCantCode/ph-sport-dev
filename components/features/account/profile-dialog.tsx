'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Briefcase, CheckCircle2, Clock, AlertCircle, Calendar, TrendingUp } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { format } from 'date-fns';

interface ProfileStats {
  total: number;
  completed: number;
  inProgress: number;
  toReview: number;
  backlog: number;
  deliveredThisMonth: number;
}

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser> | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    total: 0,
    completed: 0,
    inProgress: 0,
    toReview: 0,
    backlog: 0,
    deliveredThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      const currentUser = getCurrentUser();
      setUser(currentUser);

      if (currentUser) {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 60);
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() + 60);

        const qs = new URLSearchParams({
          weekStart: format(weekStart, 'yyyy-MM-dd'),
          weekEnd: format(weekEnd, 'yyyy-MM-dd'),
          ...(currentUser.role === 'designer' ? { designerId: currentUser.id } : {}),
        });

        fetch(`/api/designs?${qs.toString()}`)
          .then((r) => r.json())
          .then((data) => {
            const items = data.items || [];
            interface DesignItem {
              status: 'BACKLOG' | 'IN_PROGRESS' | 'TO_REVIEW' | 'DELIVERED';
              deadline_at: string;
            }
            const completed = items.filter((d: DesignItem) => d.status === 'DELIVERED').length;
            const inProgress = items.filter((d: DesignItem) => d.status === 'IN_PROGRESS').length;
            const toReview = items.filter((d: DesignItem) => d.status === 'TO_REVIEW').length;
            const backlog = items.filter((d: DesignItem) => d.status === 'BACKLOG').length;

            const deliveredThisMonth = items.filter((d: DesignItem) => {
              if (d.status !== 'DELIVERED') return false;
              const deliveredDate = new Date(d.deadline_at);
              return deliveredDate >= monthStart;
            }).length;

            setStats({
              total: items.length,
              completed,
              inProgress,
              toReview,
              backlog,
              deliveredThisMonth,
            });
            setLoading(false);
          })
          .catch(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }
  }, [open]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      designer: 'Diseñador',
      manager: 'Manager',
      admin: 'Administrador',
    };
    return roleMap[role] || role;
  };

  const getRoleColor = (role: string) => {
    if (role === 'manager' || role === 'admin') return 'from-orange-500/20 to-orange-600/20 text-orange-400';
    return 'from-blue-500/20 to-blue-600/20 text-blue-400';
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-effect border-orange-200/20 dark:border-orange-200/20 dark:border-white/10 text-gray-800 dark:text-gray-200 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-gray-800 dark:text-gray-200 flex items-center gap-3">
            <User className="h-6 w-6 text-orange-400" />
            Mi Perfil
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">Información y estadísticas de tu cuenta</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <Card className="glass-effect border-orange-200/20 dark:border-white/10">
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <Avatar className="h-20 w-20 border-2 border-orange-500/30">
                  <AvatarFallback className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 text-orange-400 text-2xl">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-1">{user.name}</h3>
                    <Badge className={`bg-gradient-to-r ${getRoleColor(user.role)} border-0`}>
                      <Briefcase className="h-3 w-3 mr-1" />
                      {getRoleLabel(user.role)}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Mail className="h-4 w-4" />
                      <span>{user.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-400" />
              Estadísticas
            </h4>
            {loading ? (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">Cargando estadísticas...</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card className="glass-effect border-orange-200/20 dark:border-white/10">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-1">{stats.total}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      Total
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-effect border-orange-200/20 dark:border-white/10">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-green-400 mb-1">{stats.completed}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Completadas
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-effect border-orange-200/20 dark:border-white/10">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-orange-400 mb-1">{stats.inProgress}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1">
                      <Clock className="h-4 w-4" />
                      En Progreso
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-effect border-orange-200/20 dark:border-white/10">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-yellow-400 mb-1">{stats.toReview}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      Pendientes Revisión
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-effect border-orange-200/20 dark:border-white/10">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-gray-600 dark:text-gray-400 mb-1">{stats.backlog}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Pendientes
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-effect border-orange-200/20 dark:border-white/10">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-blue-400 mb-1">{stats.deliveredThisMonth}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      Este Mes
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
