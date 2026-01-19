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
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Layers, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useDesigners } from '@/lib/hooks/use-designers';
import { PLAYER_STATUS_CONFIG } from '@/components/features/designs/tags/player-status-tag';

interface DesignRow {
  id: string;
  title: string;
  player: string;
  player_status: 'injured' | 'suspended' | 'doubt' | 'last_minute' | null;
}

interface BatchCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDesignsCreated: () => void;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function BatchCreateDialog({
  open,
  onOpenChange,
  onDesignsCreated,
}: BatchCreateDialogProps) {
  const [loading, setLoading] = useState(false);
  const { designers, loading: loadingDesigners } = useDesigners();

  // Campos compartidos
  const [sharedData, setSharedData] = useState({
    match_home: '',
    match_away: '',
    deadline_at: undefined as Date | undefined,
    folder_url: '',
    designer_id: null as string | null,
  });

  // Lista de diseños
  const [designRows, setDesignRows] = useState<DesignRow[]>([
    { id: generateId(), title: '', player: '', player_status: null },
  ]);

  const addRow = () => {
    setDesignRows([
      ...designRows,
      { id: generateId(), title: '', player: '', player_status: null },
    ]);
  };

  const removeRow = (id: string) => {
    if (designRows.length > 1) {
      setDesignRows(designRows.filter((r) => r.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof DesignRow, value: string | null) => {
    setDesignRows(
      designRows.map((r) =>
        r.id === id ? { ...r, [field]: value } : r
      )
    );
  };

  const resetForm = () => {
    setSharedData({
      match_home: '',
      match_away: '',
      deadline_at: undefined,
      folder_url: '',
      designer_id: null,
    });
    setDesignRows([{ id: generateId(), title: '', player: '', player_status: null }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar campos compartidos
    if (!sharedData.match_home || !sharedData.match_away || !sharedData.deadline_at) {
      toast.error('Completa los campos del partido y fecha');
      return;
    }

    const deadline = sharedData.deadline_at;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (deadline < oneHourAgo) {
      toast.error('La fecha de deadline no puede ser tan antigua');
      return;
    }

    // Validar al menos un diseño completo
    const validDesigns = designRows.filter((r) => r.title.trim() && r.player.trim());
    if (validDesigns.length === 0) {
      toast.error('Añade al menos un diseño con título y jugador');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/designs/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shared: {
            match_home: sharedData.match_home,
            match_away: sharedData.match_away,
            deadline_at: deadline.toISOString(),
            folder_url: sharedData.folder_url || undefined,
            designer_id: sharedData.designer_id || undefined,
          },
          designs: validDesigns.map((r) => ({
            title: r.title,
            player: r.player,
            player_status: r.player_status,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear diseños');
      }

      const result = await response.json();
      toast.success(`${result.created} diseño${result.created !== 1 ? 's' : ''} creado${result.created !== 1 ? 's' : ''} exitosamente`);
      
      resetForm();
      onDesignsCreated();
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al crear diseños');
    } finally {
      setLoading(false);
    }
  };

  const validCount = designRows.filter((r) => r.title.trim() && r.player.trim()).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3">
            <Layers className="h-6 w-6 text-primary" />
            Crear Diseños en Lote
          </DialogTitle>
          <DialogDescription>
            Crea múltiples diseños del mismo partido de forma rápida.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 mt-4">
            {/* Campos compartidos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información del Partido</CardTitle>
                <CardDescription>
                  Estos datos se aplicarán a todos los diseños
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="batch-match_home">Equipo Local</Label>
                    <Input
                      id="batch-match_home"
                      placeholder="Real Madrid"
                      required
                      value={sharedData.match_home}
                      onChange={(e) =>
                        setSharedData({ ...sharedData, match_home: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="batch-match_away">Equipo Visitante</Label>
                    <Input
                      id="batch-match_away"
                      placeholder="Barcelona"
                      required
                      value={sharedData.match_away}
                      onChange={(e) =>
                        setSharedData({ ...sharedData, match_away: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Fecha de entrega</Label>
                    <DateTimePicker
                      value={sharedData.deadline_at}
                      onChange={(date) =>
                        setSharedData({ ...sharedData, deadline_at: date })
                      }
                      placeholder="Selecciona fecha y hora"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="batch-designer_id">Diseñador</Label>
                    <Select
                      value={sharedData.designer_id || 'auto'}
                      onValueChange={(value) =>
                        setSharedData({
                          ...sharedData,
                          designer_id: value === 'auto' ? null : value,
                        })
                      }
                    >
                      <SelectTrigger id="batch-designer_id">
                        <SelectValue placeholder="Selecciona un diseñador" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Automático</SelectItem>
                        {loadingDesigners ? (
                          <SelectItem value="loading" disabled>
                            Cargando...
                          </SelectItem>
                        ) : (
                          designers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="batch-folder_url">URL Carpeta Drive (opcional)</Label>
                  <Input
                    id="batch-folder_url"
                    type="url"
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={sharedData.folder_url}
                    onChange={(e) =>
                      setSharedData({ ...sharedData, folder_url: e.target.value })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Lista de diseños */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Diseños a Crear</CardTitle>
                <CardDescription>
                  Añade los diseños individuales para este partido
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {designRows.map((row, index) => (
                  <div
                    key={row.id}
                    className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border"
                  >
                    <span className="text-sm font-medium text-muted-foreground w-6">
                      {index + 1}.
                    </span>
                    <Input
                      placeholder="Título del diseño"
                      value={row.title}
                      onChange={(e) => updateRow(row.id, 'title', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Jugador/Equipo"
                      value={row.player}
                      onChange={(e) => updateRow(row.id, 'player', e.target.value)}
                      className="flex-1"
                    />
                    <Select
                      value={row.player_status || 'none'}
                      onValueChange={(value) =>
                        updateRow(
                          row.id,
                          'player_status',
                          value === 'none' ? null : value
                        )
                      }
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin estado</SelectItem>
                        {Object.entries(PLAYER_STATUS_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <config.icon className="h-4 w-4" />
                              <span>{config.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(row.id)}
                      disabled={designRows.length === 1}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addRow}
                  className="w-full mt-2"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Añadir Diseño
                </Button>
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
            <Button type="submit" disabled={loading || validCount === 0}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Layers className="mr-2 h-4 w-4" />
                  Crear {validCount} Diseño{validCount !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
