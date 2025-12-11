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
import { useAuth } from '@/lib/auth/auth-context';
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
  const { user, profile } = useAuth();
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
      const loadStats = async () => {
        if (!user || !profile) {
          setLoading(false);
          return;
        }

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 60);
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() + 60);

        const qs = new URLSearchParams({
          weekStart: format(weekStart, 'yyyy-MM-dd'),
          weekEnd: format(weekEnd, 'yyyy-MM-dd'),
          ...(profile.role === 'DESIGNER' ? { designerId: user.id } : {}),
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
      };
      loadStats();
    }
  }, [open, user, profile]);

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
      DESIGNER: 'Diseñador',
      ADMIN: 'Manager', // Admin se ve como Manager
    };
    return roleMap[role] || role;
  };

  const getRoleColor = (role: string) => {
    if (role === 'ADMIN') return 'bg-primary/15 text-primary';
    return 'bg-blue-500/15 text-blue-500';
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3">
            <User className="h-6 w-6 text-primary" />
            Mi Perfil
          </DialogTitle>
          <DialogDescription>Información y estadísticas de tu cuenta</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <Avatar className="h-20 w-20 border-2 border-primary/30">
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {getInitials(profile?.full_name || user.email || '?')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-1">{profile?.full_name || 'Usuario'}</h3>
                    <Badge className={`${getRoleColor(profile?.role || '')} border-0`}>
                      <Briefcase className="h-3 w-3 mr-1" />
                      {getRoleLabel(profile?.role || '')}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{user?.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div>
            <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Estadísticas
            </h4>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Cargando estadísticas...</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-foreground mb-1">{stats.total}</div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      Total
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-green-500 mb-1">{stats.completed}</div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Completadas
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-primary mb-1">{stats.inProgress}</div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <Clock className="h-4 w-4" />
                      En Progreso
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-yellow-500 mb-1">{stats.toReview}</div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      Pendientes Revisión
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-muted-foreground mb-1">{stats.backlog}</div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Pendientes
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-blue-500 mb-1">{stats.deliveredThisMonth}</div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
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







