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
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Plus, Edit, Save, FileText, Layers, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useDesigners } from '@/lib/hooks/use-designers';
import { PLAYER_STATUS_CONFIG } from '@/components/features/designs/tags/player-status-tag';

import type { Design } from '@/lib/types/design';

type CreationMode = 'individual' | 'batch';

interface DesignRow {
  id: string;
  title: string;
  player: string;
  player_status: 'injured' | 'suspended' | 'doubt' | 'last_minute' | null;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

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
  const { designers, loading: loadingDesigners } = useDesigners();
  const isEditMode = !!design;

  // Modo de creación (solo en modo nuevo)
  const [creationMode, setCreationMode] = useState<CreationMode>('individual');

  // Datos del formulario individual
  const [formData, setFormData] = useState({
    title: '',
    player: '',
    match_home: '',
    match_away: '',
    deadline_at: undefined as Date | undefined,
    folder_url: '',
    designer_id: null as string | null,
    player_status: null as 'injured' | 'suspended' | 'doubt' | 'last_minute' | null,
  });

  // Datos para modo batch (lista de diseños)
  const [batchRows, setBatchRows] = useState<DesignRow[]>([
    { id: generateId(), title: '', player: '', player_status: null },
  ]);

  useEffect(() => {
    if (design) {
      setFormData({
        title: design.title || '',
        player: design.player || '',
        match_home: design.match_home || '',
        match_away: design.match_away || '',
        deadline_at: design.deadline_at ? new Date(design.deadline_at) : undefined,
        folder_url: design.folder_url || '',
        designer_id: design.designer_id || null,
        player_status: design.player_status || null,
      });
      setCreationMode('individual');
    } else {
      setFormData({
        title: '',
        player: '',
        match_home: '',
        match_away: '',
        deadline_at: undefined,
        folder_url: '',
        designer_id: null,
        player_status: null,
      });
      setBatchRows([{ id: generateId(), title: '', player: '', player_status: null }]);
      setCreationMode('individual');
    }
  }, [design, open]);

  const addBatchRow = () => {
    setBatchRows([
      ...batchRows,
      { id: generateId(), title: '', player: '', player_status: null },
    ]);
  };

  const removeBatchRow = (id: string) => {
    if (batchRows.length > 1) {
      setBatchRows(batchRows.filter((r) => r.id !== id));
    }
  };

  const updateBatchRow = (id: string, field: keyof DesignRow, value: string | null) => {
    setBatchRows(
      batchRows.map((r) =>
        r.id === id ? { ...r, [field]: value } : r
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.deadline_at) {
        toast.error('Selecciona una fecha de entrega');
        setLoading(false);
        return;
      }

      const deadline = formData.deadline_at;

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (!isEditMode && deadline < oneHourAgo) {
        toast.error('La fecha de deadline no puede ser tan antigua');
        setLoading(false);
        return;
      }

      if (isEditMode) {
        // Modo edición: igual que antes
        const response = await fetch(`/api/designs/${design.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            deadline_at: deadline.toISOString(),
            designer_id: formData.designer_id || null,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Error al actualizar diseño');
        }

        toast.success('Diseño actualizado exitosamente');
      } else if (creationMode === 'individual') {
        // Modo individual: crear un diseño
        const response = await fetch('/api/designs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            deadline_at: deadline.toISOString(),
            designer_id: formData.designer_id || null,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Error al crear diseño');
        }

        toast.success('Diseño creado exitosamente');
      } else {
        // Modo batch: crear múltiples diseños
        const validDesigns = batchRows.filter((r) => r.title.trim() && r.player.trim());
        if (validDesigns.length === 0) {
          toast.error('Añade al menos un diseño con título y jugador');
          setLoading(false);
          return;
        }

        const response = await fetch('/api/designs/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shared: {
              match_home: formData.match_home,
              match_away: formData.match_away,
              deadline_at: deadline.toISOString(),
              folder_url: formData.folder_url || undefined,
              designer_id: formData.designer_id || undefined,
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
        toast.success(`${result.created} diseño${result.created !== 1 ? 's' : ''} creado${result.created !== 1 ? 's' : ''}`);
      }

      // Reset form
      setFormData({
        title: '',
        player: '',
        match_home: '',
        match_away: '',
        deadline_at: undefined,
        folder_url: '',
        designer_id: null,
        player_status: null,
      });
      setBatchRows([{ id: generateId(), title: '', player: '', player_status: null }]);

      onDesignCreated();
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al crear diseño');
    } finally {
      setLoading(false);
    }
  };

  const validBatchCount = batchRows.filter((r) => r.title.trim() && r.player.trim()).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3">
            {isEditMode ? (
              <>
                <Edit className="h-6 w-6 text-primary" />
                Editar Diseño
              </>
            ) : (
              <>
                <Plus className="h-6 w-6 text-primary" />
                Crear Diseño
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Modifica los datos del diseño.' : 'Añade uno o varios diseños al equipo.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 mt-4">
            {/* Mode selector - solo en modo creación */}
            {!isEditMode && (
              <div className="flex items-center justify-center p-1 rounded-lg bg-muted border border-border">
                <button
                  type="button"
                  onClick={() => setCreationMode('individual')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    creationMode === 'individual'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  Individual
                </button>
                <button
                  type="button"
                  onClick={() => setCreationMode('batch')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    creationMode === 'batch'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Layers className="h-4 w-4" />
                  En Lote
                </button>
              </div>
            )}

            {/* Campos compartidos (siempre visibles) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información del Partido</CardTitle>
                <CardDescription>
                  {creationMode === 'batch' && !isEditMode
                    ? 'Estos datos se aplicarán a todos los diseños'
                    : 'Datos del partido relacionado'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Fecha de entrega</Label>
                    <DateTimePicker
                      value={formData.deadline_at}
                      onChange={(date) => setFormData({ ...formData, deadline_at: date })}
                      placeholder="Selecciona fecha y hora"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="designer_id">Diseñador</Label>
                    <Select
                      value={formData.designer_id || 'auto'}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          designer_id: value === 'auto' ? null : value,
                        })
                      }
                    >
                      <SelectTrigger id="designer_id">
                        <SelectValue placeholder="Selecciona un diseñador" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Automático</SelectItem>
                        {loadingDesigners ? (
                          <SelectItem value="loading" disabled>Cargando...</SelectItem>
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
                  <Label htmlFor="folder_url">URL Carpeta Drive (opcional)</Label>
                  <Input
                    id="folder_url"
                    type="url"
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={formData.folder_url}
                    onChange={(e) => setFormData({ ...formData, folder_url: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contenido específico del modo */}
            {(creationMode === 'individual' || isEditMode) ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Detalles del Diseño</CardTitle>
                  <CardDescription>Información específica de este diseño</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                  <div className="grid grid-cols-2 gap-4">
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
                    <div className="grid gap-2">
                      <Label htmlFor="player_status">Estado Jugador (Opcional)</Label>
                      <Select
                        value={formData.player_status || 'none'}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            player_status: value === 'none' ? null : (value as 'injured' | 'suspended' | 'doubt' | 'last_minute'),
                          })
                        }
                      >
                        <SelectTrigger id="player_status">
                          <SelectValue placeholder="Sin estado" />
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Diseños a Crear</CardTitle>
                  <CardDescription>Añade los diseños para este partido</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {batchRows.map((row, index) => (
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
                        onChange={(e) => updateBatchRow(row.id, 'title', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Jugador/Equipo"
                        value={row.player}
                        onChange={(e) => updateBatchRow(row.id, 'player', e.target.value)}
                        className="flex-1"
                      />
                      <Select
                        value={row.player_status || 'none'}
                        onValueChange={(value) =>
                          updateBatchRow(
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
                        onClick={() => removeBatchRow(row.id)}
                        disabled={batchRows.length === 1}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addBatchRow}
                    className="w-full mt-2"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Añadir Diseño
                  </Button>
                </CardContent>
              </Card>
            )}
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
              type="submit"
              disabled={loading || (creationMode === 'batch' && !isEditMode && validBatchCount === 0)}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  {isEditMode ? (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar Cambios
                    </>
                  ) : creationMode === 'individual' ? (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Crear Diseño
                    </>
                  ) : (
                    <>
                      <Layers className="mr-2 h-4 w-4" />
                      Crear {validBatchCount} Diseño{validBatchCount !== 1 ? 's' : ''}
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
