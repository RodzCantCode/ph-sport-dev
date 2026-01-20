'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings, Bell, Eye, Save, Camera, Loader2, Mail, Smartphone } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface NotificationPreferences {
  email: {
    assignment: boolean;
    statusChanges: boolean;
    upcomingDeadlines: boolean;
    comments: boolean;
  };
  in_app: {
    assignment: boolean;
    statusChanges: boolean;
    upcomingDeadlines: boolean;
    comments: boolean;
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
  const [defaultView, setDefaultView] = useState<'list' | 'calendar'>('list');
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: {
      assignment: true,
      statusChanges: true,
      upcomingDeadlines: true,
      comments: true,
    },
    in_app: {
      assignment: true,
      statusChanges: true,
      upcomingDeadlines: true,
      comments: true,
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
      const loadPreferences = async () => {
        if (!user) return;
        
        const { data, error } = await supabase
          .from('profiles')
          .select('notification_preferences')
          .eq('id', user.id)
          .single();

        if (data?.notification_preferences) {
          // Merge with default to ensure all keys exist
          const dbPrefs = data.notification_preferences as any;
          setPreferences({
            email: {
              assignment: dbPrefs.email?.assignment ?? true,
              statusChanges: dbPrefs.email?.status_change ?? true,
              upcomingDeadlines: dbPrefs.email?.deadline ?? true,
              comments: dbPrefs.email?.comment ?? true,
            },
            in_app: {
              assignment: dbPrefs.in_app?.assignment ?? true,
              statusChanges: dbPrefs.in_app?.status_change ?? true,
              upcomingDeadlines: dbPrefs.in_app?.deadline ?? true,
              comments: dbPrefs.in_app?.comment ?? true,
            },
          });
        }
      };
      
      loadPreferences();
      
      // Load view preference from local storage as it is device specific
      const storedView = localStorage.getItem('defaultView');
      if (storedView) setDefaultView(storedView as 'list' | 'calendar');
    }
  }, [open, profile, user, supabase]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
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

      toast.success('Avatar actualizado correctamente');
      window.location.reload(); // Recargar para actualizar el contexto de auth
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast.error('Error al actualizar el avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    
    try {
      // Save view preference to localStorage
      localStorage.setItem('defaultView', defaultView);

      // Map preferences to DB structure (snake_case)
      const dbPreferences = {
        email: {
          assignment: preferences.email.assignment,
          status_change: preferences.email.statusChanges,
          deadline: preferences.email.upcomingDeadlines,
          comment: preferences.email.comments,
        },
        in_app: {
          assignment: preferences.in_app.assignment,
          status_change: preferences.in_app.statusChanges,
          deadline: preferences.in_app.upcomingDeadlines,
          comment: preferences.in_app.comments,
        },
      };

      // Save profile and notifications to DB
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: name,
          notification_preferences: dbPreferences,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Configuración guardada correctamente');
      onOpenChange(false);
      window.location.reload(); // Recargar para ver los cambios reflejados
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const togglePreference = (channel: 'email' | 'in_app', type: keyof NotificationPreferences['email']) => {
    setPreferences(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [type]: !prev[channel][type]
      }
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-background border-border shadow-xl">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 border-b border-border pb-4">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Configuración</h2>
          </div>

          <Tabs defaultValue="account" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50">
              <TabsTrigger value="account" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-primary">
                <Settings className="h-4 w-4" />
                Cuenta
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-primary">
                <Bell className="h-4 w-4" />
                Notificaciones
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-primary">
                <Eye className="h-4 w-4" />
                Apariencia
              </TabsTrigger>
            </TabsList>

            {/* Account Settings */}
            <TabsContent value="account" className="space-y-6 animate-fade-in">
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                  <Avatar className="h-24 w-24 border-2 border-border group-hover:border-primary transition-colors">
                    <AvatarImage src={profile?.avatar_url || ''} />
                    <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                      {name 
                        ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                        : user?.email?.split('@')[0].substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {uploading ? (
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">Haz clic para cambiar tu foto</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                    className="bg-background border-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted text-muted-foreground border-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Input
                    id="role"
                    value={profile?.role || 'User'}
                    disabled
                    className="bg-muted text-muted-foreground border-input capitalize"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Notification Settings */}
            <TabsContent value="notifications" className="space-y-6 animate-fade-in">
              <div className="bg-muted/30 p-4 rounded-lg border border-border/50 mb-4">
                <h3 className="text-sm font-medium text-foreground mb-1">Preferencias de canales</h3>
                <p className="text-xs text-muted-foreground">
                  Elige cómo quieres recibir las notificaciones para cada tipo de evento.
                </p>
              </div>

              <div className="space-y-6">
                {/* Headers */}
                <div className="grid grid-cols-3 gap-4 pb-2 border-b border-border/50">
                  <span className="text-sm font-medium text-muted-foreground">Evento</span>
                  <div className="flex flex-col items-center justify-center">
                    <Mail className="h-4 w-4 mb-1 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">Email</span>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <Smartphone className="h-4 w-4 mb-1 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">In-App</span>
                  </div>
                </div>

                {/* Assignments */}
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">Nuevas Asignaciones</span>
                    <span className="text-xs text-muted-foreground">Cuando se te asigna un diseño</span>
                  </div>
                  <div className="flex justify-center">
                    <Switch 
                      checked={preferences.email.assignment}
                      onCheckedChange={() => togglePreference('email', 'assignment')} 
                    />
                  </div>
                  <div className="flex justify-center">
                    <Switch 
                      checked={preferences.in_app.assignment}
                      onCheckedChange={() => togglePreference('in_app', 'assignment')} 
                    />
                  </div>
                </div>

                {/* Status Changes */}
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">Cambios de Estado</span>
                    <span className="text-xs text-muted-foreground">Cuando cambia el estado de tus diseños</span>
                  </div>
                  <div className="flex justify-center">
                    <Switch 
                      checked={preferences.email.statusChanges}
                      onCheckedChange={() => togglePreference('email', 'statusChanges')} 
                    />
                  </div>
                  <div className="flex justify-center">
                    <Switch 
                      checked={preferences.in_app.statusChanges}
                      onCheckedChange={() => togglePreference('in_app', 'statusChanges')} 
                    />
                  </div>
                </div>

                {/* Deadlines */}
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">Deadlines Próximos</span>
                    <span className="text-xs text-muted-foreground">Recordatorios de fechas límite</span>
                  </div>
                  <div className="flex justify-center">
                    <Switch 
                      checked={preferences.email.upcomingDeadlines}
                      onCheckedChange={() => togglePreference('email', 'upcomingDeadlines')} 
                    />
                  </div>
                  <div className="flex justify-center">
                    <Switch 
                      checked={preferences.in_app.upcomingDeadlines}
                      onCheckedChange={() => togglePreference('in_app', 'upcomingDeadlines')} 
                    />
                  </div>
                </div>

                {/* Comments */}
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">Nuevos Comentarios</span>
                    <span className="text-xs text-muted-foreground">Cuando alguien comenta en tu diseño</span>
                  </div>
                  <div className="flex justify-center">
                    <Switch 
                      checked={preferences.email.comments}
                      onCheckedChange={() => togglePreference('email', 'comments')} 
                    />
                  </div>
                  <div className="flex justify-center">
                    <Switch 
                      checked={preferences.in_app.comments}
                      onCheckedChange={() => togglePreference('in_app', 'comments')} 
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Appearance Settings */}
            <TabsContent value="appearance" className="space-y-6 animate-fade-in">
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label>Vista predeterminada del Dashboard</Label>
                  <Select 
                    value={defaultView} 
                    onValueChange={(value) => setDefaultView(value as 'list' | 'calendar')}
                  >
                    <SelectTrigger className="w-full bg-background border-input">
                      <SelectValue placeholder="Selecciona una vista" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="list">Vista de Lista</SelectItem>
                      <SelectItem value="calendar">Vista de Calendario</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Elige cómo quieres ver tus tareas al iniciar sesión.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="border-input hover:bg-accent hover:text-accent-foreground"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[100px]"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
