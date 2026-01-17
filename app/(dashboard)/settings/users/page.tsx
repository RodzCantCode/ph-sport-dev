'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UsersSkeleton } from '@/components/skeletons/users-skeleton';
import { PageTransition } from '@/components/ui/page-transition';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Plus, 
  Copy, 
  Trash2, 
  CheckCircle,
  Users,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth/auth-context';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { CreateInvitationDialog } from '@/components/invitations/create-invitation-dialog';

interface Profile {
  id: string;
  full_name: string;
  role: 'ADMIN' | 'DESIGNER' | 'USER';
  created_at: string;
}

interface Invitation {
  id: string;
  token: string;
  role: 'ADMIN' | 'DESIGNER' | 'USER';
  uses: number;
  max_uses: number;
  expires_at: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  DESIGNER: 'Diseñador',
  USER: 'Usuario',
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-primary/20 text-primary border-primary/30',
  DESIGNER: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  USER: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export default function UsersPage() {
  const { profile: currentProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<Profile[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showInvitations, setShowInvitations] = useState(true);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    
    // Load users
    const { data: usersData } = await supabase
      .from('profiles')
      .select('id, full_name, role, created_at')
      .order('created_at', { ascending: true });

    setUsers(usersData || []);

    // Load all invitations (we'll show status badges)
    const { data: invData } = await supabase
      .from('invitations')
      .select('id, token, role, uses, max_uses, expires_at')
      .order('created_at', { ascending: false });

    setInvitations(invData || []);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    
    if (!currentProfile || currentProfile.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    const load = async () => {
      setLoading(true);
      await loadData();
      setLoading(false);
    };

    load();
  }, [authLoading, currentProfile, router, loadData]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getInviteUrl = (token: string) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/invite/${token}`;
  };

  const copyToClipboard = async (token: string, id: string) => {
    try {
      await navigator.clipboard.writeText(getInviteUrl(token));
      setCopiedId(id);
      toast.success('Link copiado');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Error al copiar');
    }
  };

  const deleteInvitation = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('invitations').delete().eq('id', id);
    
    if (error) {
      toast.error('Error al eliminar');
      return;
    }
    
    toast.success('Invitación eliminada');
    setInvitations(prev => prev.filter(inv => inv.id !== id));
  };

  const getTimeRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return 'Sin límite';
    const expires = new Date(expiresAt);
    if (expires < new Date()) return 'Expirada';
    return formatDistanceToNow(expires, { locale: es, addSuffix: true });
  };

  const getInvitationStatus = (invitation: Invitation) => {
    if (invitation.uses >= invitation.max_uses) {
      return { label: 'Usada', color: 'bg-green-500/20 text-green-400 border-green-500/30' };
    }
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return { label: 'Expirada', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
    }
    return { label: 'Activa', color: 'bg-primary/20 text-primary border-primary/30' };
  };

  return (
    <PageTransition loading={loading || authLoading} skeleton={<UsersSkeleton />}>
      {(!currentProfile || currentProfile.role !== 'ADMIN') ? null : (
        <div className="flex flex-col gap-6 p-6 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-up">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Usuarios</h1>
          <p className="text-muted-foreground">Gestiona el equipo de PH Sport</p>
        </div>

        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Invitar Usuario
        </Button>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Equipo ({users.length})
          </CardTitle>
          <CardDescription>Miembros activos del equipo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between py-3 gap-4"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {getInitials(user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{user.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Desde {formatDistanceToNow(new Date(user.created_at), { locale: es, addSuffix: true })}
                    </p>
                  </div>
                </div>
                <Badge className={ROLE_COLORS[user.role]}>
                  {ROLE_LABELS[user.role]}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations (Collapsible) */}
      <Card>
        <CardHeader 
          className="cursor-pointer" 
          onClick={() => setShowInvitations(!showInvitations)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Invitaciones pendientes {invitations.length > 0 && `(${invitations.length})`}
            </CardTitle>
            {showInvitations ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {showInvitations && (
          <CardContent>
            {invitations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay invitaciones pendientes
              </p>
            ) : (
              <div className="divide-y divide-border">
                {invitations.map((invitation) => {
                  const status = getInvitationStatus(invitation);
                  const isActive = status.label === 'Activa';
                  return (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between py-3 gap-4"
                    >
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge className={ROLE_COLORS[invitation.role]}>
                          {ROLE_LABELS[invitation.role]}
                        </Badge>
                        <Badge className={status.color}>
                          {status.label}
                        </Badge>
                        {isActive && (
                          <span className="text-sm text-muted-foreground">
                            Expira {getTimeRemaining(invitation.expires_at)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {isActive && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(invitation.token, invitation.id)}
                          >
                            {copiedId === invitation.id ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteInvitation(invitation.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <CreateInvitationDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        onCreated={loadData}
      />
        </div>
      )}
    </PageTransition>
  );
}
