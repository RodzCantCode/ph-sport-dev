'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Save } from 'lucide-react';
import { toast } from 'sonner';
import { mockUsers } from '@/lib/data/mock-data';

import type { Design } from '@/lib/types/design';

interface CreateDesignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDesignCreated: () => void;
  design?: Design | null;
}

export function CreateDesignDialog({
  open,
  onOpenChange,
  onDesignCreated,
  design,
}: CreateDesignDialogProps) {
  const [loading, setLoading] = useState(false);
  const isEditMode = !!design;

  const formatDateTimeLocal = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    title: '',
    player: '',
    match_home: '',
    match_away: '',
    deadline_at: '',
    folder_url: '',
    designer_id: null as string | null,
  });

  useEffect(() => {
    if (design) {
      setFormData({
        title: design.title || '',
        player: design.player || '',
        match_home: design.match_home || '',
        match_away: design.match_away || '',
        deadline_at: formatDateTimeLocal(design.deadline_at),
        folder_url: design.folder_url || '',
        designer_id: design.designer_id || null,
      });
    } else {
      setFormData({
        title: '',
        player: '',
        match_home: '',
        match_away: '',
        deadline_at: '',
        folder_url: '',
        designer_id: null,
      });
    }
  }, [design, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const deadline = new Date(formData.deadline_at);
      if (isNaN(deadline.getTime())) {
        toast.error('Fecha inválida');
        setLoading(false);
        return;
      }
      if (!isEditMode && deadline < new Date()) {
        toast.error('La fecha de deadline debe ser futura');
        setLoading(false);
        return;
      }

      const url = isEditMode ? `/api/designs/${design.id}` : '/api/designs';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          deadline_at: deadline.toISOString(),
          designer_id: formData.designer_id || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Error al ${isEditMode ? 'actualizar' : 'crear'} diseño`);
      }

      toast.success(`Diseño ${isEditMode ? 'actualizado' : 'creado'} exitosamente`);
      if (!isEditMode) {
        setFormData({
          title: '',
          player: '',
          match_home: '',
          match_away: '',
          deadline_at: '',
          folder_url: '',
          designer_id: null,
        });
      }
      onDesignCreated();
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al crear diseño');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-effect border-white/10 text-gray-200 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-gray-200 flex items-center gap-3">
            {isEditMode ? (
              <>
                <Edit className="h-6 w-6 text-orange-400" />
                Editar Diseño
              </>
            ) : (
              <>
                <Plus className="h-6 w-6 text-orange-400" />
                Crear Nuevo Diseño
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {isEditMode ? 'Modifica los datos del diseño.' : 'Añade un nuevo diseño/tarea para el equipo.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 mt-4">
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-lg text-gray-200">Información Básica</CardTitle>
                <CardDescription className="text-gray-400">Datos principales del diseño</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="title" className="text-gray-300">
                    Título
                  </Label>
                  <Input
                    id="title"
                    placeholder="Matchday Real Madrid"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="glass-effect text-gray-200 placeholder-gray-500"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="player" className="text-gray-300">
                    Jugador/Equipo
                  </Label>
                  <Input
                    id="player"
                    placeholder="Equipo / Jugador X"
                    required
                    value={formData.player}
                    onChange={(e) => setFormData({ ...formData, player: e.target.value })}
                    className="glass-effect text-gray-200 placeholder-gray-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="match_home" className="text-gray-300">
                      Equipo Local
                    </Label>
                    <Input
                      id="match_home"
                      placeholder="Real Madrid"
                      required
                      value={formData.match_home}
                      onChange={(e) => setFormData({ ...formData, match_home: e.target.value })}
                      className="glass-effect text-gray-200 placeholder-gray-500"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="match_away" className="text-gray-300">
                      Equipo Visitante
                    </Label>
                    <Input
                      id="match_away"
                      placeholder="Barcelona"
                      required
                      value={formData.match_away}
                      onChange={(e) => setFormData({ ...formData, match_away: e.target.value })}
                      className="glass-effect text-gray-200 placeholder-gray-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-lg text-gray-200">Asignación</CardTitle>
                <CardDescription className="text-gray-400">
                  Selecciona un diseñador o deja en automático para asignación balanceada
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  <Label htmlFor="designer_id" className="text-gray-300">
                    Diseñador
                  </Label>
                  <Select
                    value={formData.designer_id || 'auto'}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        designer_id: value === 'auto' ? null : value,
                      })
                    }
                  >
                    <SelectTrigger id="designer_id" className="glass-effect text-gray-200">
                      <SelectValue placeholder="Selecciona un diseñador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Automático</SelectItem>
                      {mockUsers
                        .filter((u) => u.role === 'designer')
                        .map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    {formData.designer_id
                      ? 'El diseño se asignará al diseñador seleccionado'
                      : 'El sistema asignará automáticamente al diseñador con menor carga de trabajo'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-lg text-gray-200">Fechas y Recursos</CardTitle>
                <CardDescription className="text-gray-400">Deadline y enlaces a recursos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="deadline_at" className="text-gray-300">
                    Deadline
                  </Label>
                  <Input
                    id="deadline_at"
                    type="datetime-local"
                    required
                    value={formData.deadline_at}
                    onChange={(e) => setFormData({ ...formData, deadline_at: e.target.value })}
                    className="glass-effect text-gray-200 placeholder-gray-500"
                  />
                  <p className="text-xs text-gray-500">
                    {isEditMode ? 'Puedes modificar la fecha del deadline' : 'La fecha debe ser futura'}
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="folder_url" className="text-gray-300">
                    URL Carpeta Drive (opcional)
                  </Label>
                  <Input
                    id="folder_url"
                    type="url"
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={formData.folder_url}
                    onChange={(e) => setFormData({ ...formData, folder_url: e.target.value })}
                    className="glass-effect text-gray-200 placeholder-gray-500"
                  />
                  <p className="text-xs text-gray-500">
                    Enlace a la carpeta de Google Drive donde se almacenan los archivos del diseño
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-white/10 text-gray-300 hover:bg-white/5"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            >
              {loading ? (
                'Guardando...'
              ) : (
                <>
                  {isEditMode ? (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar Cambios
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Crear Diseño
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


