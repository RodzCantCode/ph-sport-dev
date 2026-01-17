'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Settings, Bell, Eye, Save, Camera, Loader2, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { createClient } from '@/lib/supabase/client';
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
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Account State
  const [name, setName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preferences State
  const [preferences, setPreferences] = useState<UserPreferences>({
    defaultView: 'list',
    notifications: {
      newAssignments: true,
      statusChanges: true,
      upcomingDeadlines: true,
    },
  });


  useEffect(() => {
    if (open) {
        // Init Name
      if (profile?.full_name) {
        setName(profile.full_name);
      } else if (user?.email) {
        setName(user.email.split('@')[0]);
      }

      // Init Preferences
      if (typeof window !== 'undefined') {
        const savedPrefs = localStorage.getItem('user-preferences');
        if (savedPrefs) {
          try {
            setPreferences(JSON.parse(savedPrefs));
          } catch {}
        }

        const savedView = localStorage.getItem('default-view') as 'list' | 'calendar' | null;
        if (savedView) {
          setPreferences((prev) => ({ ...prev, defaultView: savedView }));
        }
      }
    }
  }, [open, user, profile]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file || !user) return;

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      window.location.reload(); 
      toast.success('Avatar actualizado');

    } catch (error) {
      toast.error('Error al subir la imagen');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // 1. Save Preferences (Local)
      if (typeof window !== 'undefined') {
        localStorage.setItem('user-preferences', JSON.stringify(preferences));
        localStorage.setItem('default-view', preferences.defaultView);
      }

      // 2. Save Profile (DB)
      if (user && name !== profile?.full_name) {
          const { error } = await supabase
            .from('profiles')
            .update({ full_name: name })
            .eq('id', user.id);
          
          if(error) throw error;
          // Force reload to update context mostly for name change
           window.location.reload();
      } else {
        // Just close if only prefs changed
         onOpenChange(false);
      }

      toast.success('Configuración guardada');
      
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (val: string) => {
    return val.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <div className="px-6 py-4 border-b">
          <DialogTitle className="text-xl flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración
          </DialogTitle>
          <DialogDescription>
            Gestiona tu cuenta y preferencias
          </DialogDescription>
        </div>

        <Tabs defaultValue="account" className="w-full">
            <div className="px-6 pt-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="account">Cuenta</TabsTrigger>
                    <TabsTrigger value="preferences">Preferencias</TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="account" className="p-6 space-y-6">
                 {/* Avatar */}
                 <div className="flex flex-col items-center gap-4">
                    <div className="relative group">
                        <Avatar className="h-24 w-24 border-4 border-background shadow-lg cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <AvatarImage src={profile?.avatar_url || ''} className="object-cover" />
                        <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                            {getInitials(name || user.email || '?')}
                        </AvatarFallback>
                        
                        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <Camera className="h-8 w-8 text-white" />
                        </div>
                        </Avatar>
                        
                        {uploading && (
                        <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                        )}
                        
                        <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        disabled={uploading}
                        />
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        Cambiar foto
                    </Button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre Completo</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Tu nombre"
                        />
                        <p className="text-xs text-muted-foreground">Este es el nombre que verán los demás usuarios.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                            Email
                            <Lock className="h-3 w-3 text-muted-foreground" />
                        </Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="email"
                                value={user.email}
                                disabled
                                className="pl-9 bg-muted/50 cursor-not-allowed text-muted-foreground"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Por seguridad, el email no se puede cambiar directamente.
                        </p>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="preferences" className="p-6 space-y-6">
                <Card>
                    <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Eye className="h-4 w-4 text-primary" />
                        Visualización
                    </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Vista Predeterminada</Label>
                            <Select
                            value={preferences.defaultView}
                            onValueChange={(value: 'list' | 'calendar') =>
                                setPreferences((prev) => ({ ...prev, defaultView: value }))
                            }
                            >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una vista" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="list">Lista</SelectItem>
                                <SelectItem value="calendar">Calendario</SelectItem>
                            </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                            Vista por defecto en &quot;Mi Semana&quot;
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Bell className="h-4 w-4 text-primary" />
                        Notificaciones
                    </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         {/* Checkboxes logic mostly visual for now */}
                        <div className="flex items-center justify-between">
                            <Label htmlFor="notify-assignments" className="font-normal">Nuevas asignaciones</Label>
                            <input
                                id="notify-assignments"
                                type="checkbox"
                                checked={preferences.notifications.newAssignments}
                                onChange={(e) => setPreferences(p => ({...p, notifications: {...p.notifications, newAssignments: e.target.checked}}))}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="notify-status" className="font-normal">Cambios de estado</Label>
                            <input
                                id="notify-status"
                                type="checkbox"
                                checked={preferences.notifications.statusChanges}
                                onChange={(e) => setPreferences(p => ({...p, notifications: {...p.notifications, statusChanges: e.target.checked}}))}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="notify-deadlines" className="font-normal">Fecha de entrega próxima</Label>
                            <input
                                id="notify-deadlines"
                                type="checkbox"
                                checked={preferences.notifications.upcomingDeadlines}
                                onChange={(e) => setPreferences(p => ({...p, notifications: {...p.notifications, upcomingDeadlines: e.target.checked}}))}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <DialogFooter className="px-6 py-4 border-t bg-muted/20">
                <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
                    Cancelar
                </Button>
                <Button onClick={handleSaveAll} disabled={saving} type="button">
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        <>
                             <Save className="mr-2 h-4 w-4" />
                             Guardar cambios
                        </>
                    )}
                </Button>
            </DialogFooter>
        </Tabs>

      </DialogContent>
    </Dialog>
  );
}
