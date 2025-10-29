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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface CreateMatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMatchCreated: () => void;
}

export function CreateMatchDialog({ open, onOpenChange, onMatchCreated }: CreateMatchDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    opponent: '',
    competition: 'La Liga',
    notes: '',
    drive_folder_id: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // TODO: Create match in database
    // For now, just show success
    setTimeout(() => {
      toast.success('Partido creado exitosamente');
      onMatchCreated();
      setFormData({
        date: '',
        opponent: '',
        competition: 'La Liga',
        notes: '',
        drive_folder_id: '',
      });
      setLoading(false);
      onOpenChange(false);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Partido</DialogTitle>
          <DialogDescription>
            Añade un nuevo partido y se generarán automáticamente los assets necesarios.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Fecha del Partido</Label>
              <Input
                id="date"
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="opponent">Oponente</Label>
              <Input
                id="opponent"
                placeholder="Real Madrid CF"
                required
                value={formData.opponent}
                onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="competition">Competición</Label>
              <Input
                id="competition"
                placeholder="La Liga"
                value={formData.competition}
                onChange={(e) => setFormData({ ...formData, competition: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="drive_folder_id">URL Carpeta Drive</Label>
              <Input
                id="drive_folder_id"
                placeholder="https://drive.google.com/..."
                value={formData.drive_folder_id}
                onChange={(e) => setFormData({ ...formData, drive_folder_id: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                placeholder="Información adicional sobre el partido..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Partido'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


