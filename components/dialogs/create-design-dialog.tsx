'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface CreateDesignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDesignCreated: () => void;
}

export function CreateDesignDialog({ open, onOpenChange, onDesignCreated }: CreateDesignDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    player: '',
    match_home: '',
    match_away: '',
    deadline_at: '',
    folder_url: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar fecha
      const deadline = new Date(formData.deadline_at);
      if (isNaN(deadline.getTime()) || deadline < new Date()) {
        toast.error('La fecha de deadline debe ser futura');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          deadline_at: deadline.toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear diseño');
      }

      toast.success('Diseño creado exitosamente');
      setFormData({
        title: '',
        player: '',
        match_home: '',
        match_away: '',
        deadline_at: '',
        folder_url: '',
      });
      onDesignCreated();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Error al crear diseño');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Diseño</DialogTitle>
          <DialogDescription>
            Añade un nuevo diseño/tarea para el equipo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                placeholder="Matchday Real Madrid"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="player">Jugador/Equipo</Label>
              <Input
                id="player"
                placeholder="Equipo / Jugador X"
                required
                value={formData.player}
                onChange={(e) => setFormData({ ...formData, player: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label htmlFor="match_home">Equipo Local</Label>
                <Input
                  id="match_home"
                  placeholder="Real Madrid"
                  required
                  value={formData.match_home}
                  onChange={(e) => setFormData({ ...formData, match_home: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="match_away">Equipo Visitante</Label>
                <Input
                  id="match_away"
                  placeholder="Barcelona"
                  required
                  value={formData.match_away}
                  onChange={(e) => setFormData({ ...formData, match_away: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="deadline_at">Deadline</Label>
              <Input
                id="deadline_at"
                type="datetime-local"
                required
                value={formData.deadline_at}
                onChange={(e) => setFormData({ ...formData, deadline_at: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="folder_url">URL Carpeta Drive (opcional)</Label>
              <Input
                id="folder_url"
                type="url"
                placeholder="https://drive.google.com/drive/folders/..."
                value={formData.folder_url}
                onChange={(e) => setFormData({ ...formData, folder_url: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Diseño'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


