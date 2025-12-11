'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, User, Bell, Eye, Save } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { toast } from 'sonner';

interface UserPreferences {
  defaultView: 'list' | 'calendar';
  notifications: {
    newAssignments: boolean;
    statusChanges: boolean;
    upcomingDeadlines: boolean;
  };
}

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { user, profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    defaultView: 'list',
    notifications: {
      newAssignments: true,
      statusChanges: true,
      upcomingDeadlines: true,
    },
  });
  const [name, setName] = useState('');

  useEffect(() => {
    if (open && profile) {
      setName(profile.full_name || '');
    } else if (open && user?.email) {
      setName(user.email.split('@')[0]);
    }

    if (open) {
      if (typeof window !== 'undefined') {
        const savedPrefs = localStorage.getItem('user-preferences');
        if (savedPrefs) {
          try {
            setPreferences(JSON.parse(savedPrefs));
          } catch {
            // Valores por defecto
          }
        }

        const savedView = localStorage.getItem('default-view') as 'list' | 'calendar' | null;
        if (savedView) {
          setPreferences((prev) => ({ ...prev, defaultView: savedView }));
        }
      }
    }
  }, [open, user, profile]);

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('user-preferences', JSON.stringify(preferences));
        localStorage.setItem('default-view', preferences.defaultView);

        if (user) {
          // TODO: Actualizar nombre en Supabase profiles
          // setUser({ ...user, name });
        }
      }

      toast.success('Preferencias guardadas correctamente');
      setTimeout(() => {
        onOpenChange(false);
      }, 500);
    } catch {
      toast.error('Error al guardar preferencias');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3">
            <Settings className="h-6 w-6 text-primary" />
            Configuración
          </DialogTitle>
          <DialogDescription>
            Gestiona tus preferencias y configuración de cuenta
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Información de Cuenta
              </CardTitle>
              <CardDescription>Actualiza tu información personal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nombre
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email
                </Label>
                <Input
                  id="email"
                  value={user.email}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">El email no se puede cambiar en modo demo</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Preferencias de Visualización
              </CardTitle>
              <CardDescription>Personaliza cómo ves la información</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="defaultView">
                  Vista Predeterminada
                </Label>
                <Select
                  value={preferences.defaultView}
                  onValueChange={(value: 'list' | 'calendar') =>
                    setPreferences((prev) => ({
                      ...prev,
                      defaultView: value,
                    }))
                  }
                >
                  <SelectTrigger id="defaultView" className="w-full">
                    <SelectValue placeholder="Selecciona una vista" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="list">Lista</SelectItem>
                    <SelectItem value="calendar">Calendario</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Vista que se mostrará por defecto en &quot;Mi Semana&quot;
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notificaciones
              </CardTitle>
              <CardDescription>
                Configura las alertas que deseas recibir (futura implementación)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="newAssignments" className="cursor-pointer">
                    Nuevas Asignaciones
                  </Label>
                  <p className="text-xs text-muted-foreground">Recibir alertas cuando se te asignen nuevas tareas</p>
                </div>
                <input
                  id="newAssignments"
                  type="checkbox"
                  checked={preferences.notifications.newAssignments}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        newAssignments: e.target.checked,
                      },
                    }))
                  }
                  className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-ring focus:ring-offset-0 cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="statusChanges" className="cursor-pointer">
                    Cambios de Estado
                  </Label>
                  <p className="text-xs text-muted-foreground">Recibir alertas cuando cambien el estado de tus tareas</p>
                </div>
                <input
                  id="statusChanges"
                  type="checkbox"
                  checked={preferences.notifications.statusChanges}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        statusChanges: e.target.checked,
                      },
                    }))
                  }
                  className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-ring focus:ring-offset-0 cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="upcomingDeadlines" className="cursor-pointer">
                    Próximas Entregas
                  </Label>
                  <p className="text-xs text-muted-foreground">Recibir recordatorios de deadlines cercanos</p>
                </div>
                <input
                  id="upcomingDeadlines"
                  type="checkbox"
                  checked={preferences.notifications.upcomingDeadlines}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        upcomingDeadlines: e.target.checked,
                      },
                    }))
                  }
                  className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-ring focus:ring-offset-0 cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSavePreferences}
            disabled={saving}
          >
            {saving ? (
              'Guardando...'
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


