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
import { getCurrentUser } from '@/lib/auth/get-current-user';
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
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser> | null>(null);
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
    if (open) {
      const currentUser = getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        setName(currentUser.name);
      }

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
  }, [open]);

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('user-preferences', JSON.stringify(preferences));
        localStorage.setItem('default-view', preferences.defaultView);

        if (user) {
          const updatedUser = { ...user, name };
          sessionStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
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
      <DialogContent className="glass-effect border-orange-200/20 dark:border-white/10 text-gray-800 dark:text-gray-200 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-gray-800 dark:text-gray-200 flex items-center gap-3">
            <Settings className="h-6 w-6 text-orange-400" />
            Configuración
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Gestiona tus preferencias y configuración de cuenta
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <Card className="glass-effect border-orange-200/20 dark:border-white/10">
            <CardHeader>
              <CardTitle className="text-lg text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <User className="h-5 w-5 text-orange-400" />
                Información de Cuenta
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Actualiza tu información personal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">
                  Nombre
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="glass-effect text-gray-800 dark:text-gray-200 placeholder-gray-500"
                  placeholder="Tu nombre"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                  Email
                </Label>
                <Input
                  id="email"
                  value={user.email}
                  disabled
                  className="glass-effect text-gray-600 dark:text-gray-400 bg-white/5 cursor-not-allowed"
                />
                <p className="text-xs text-gray-600 dark:text-gray-500">El email no se puede cambiar en modo demo</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-orange-200/20 dark:border-white/10">
            <CardHeader>
              <CardTitle className="text-lg text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Eye className="h-5 w-5 text-orange-400" />
                Preferencias de Visualización
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Personaliza cómo ves la información</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="defaultView" className="text-gray-700 dark:text-gray-300">
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
                <p className="text-xs text-gray-600 dark:text-gray-500">
                  Vista que se mostrará por defecto en &quot;Mi Semana&quot;
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-orange-200/20 dark:border-white/10">
            <CardHeader>
              <CardTitle className="text-lg text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-400" />
                Notificaciones
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Configura las alertas que deseas recibir (futura implementación)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="newAssignments" className="text-gray-700 dark:text-gray-300 cursor-pointer">
                    Nuevas Asignaciones
                  </Label>
                  <p className="text-xs text-gray-600 dark:text-gray-500">Recibir alertas cuando se te asignen nuevas tareas</p>
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
                  className="h-4 w-4 rounded border-white/20 bg-white/5 text-orange-500 focus:ring-orange-500 focus:ring-offset-0 cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="statusChanges" className="text-gray-700 dark:text-gray-300 cursor-pointer">
                    Cambios de Estado
                  </Label>
                  <p className="text-xs text-gray-600 dark:text-gray-500">Recibir alertas cuando cambien el estado de tus tareas</p>
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
                  className="h-4 w-4 rounded border-white/20 bg-white/5 text-orange-500 focus:ring-orange-500 focus:ring-offset-0 cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="upcomingDeadlines" className="text-gray-700 dark:text-gray-300 cursor-pointer">
                    Deadlines Próximos
                  </Label>
                  <p className="text-xs text-gray-600 dark:text-gray-500">Recibir recordatorios de deadlines cercanos</p>
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
                  className="h-4 w-4 rounded border-white/20 bg-white/5 text-orange-500 focus:ring-orange-500 focus:ring-offset-0 cursor-pointer"
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
            className="border-orange-200/20 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/5 dark:hover:bg-white/5"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSavePreferences}
            disabled={saving}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
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


