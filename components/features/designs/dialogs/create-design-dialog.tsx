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
import { Plus, Edit, Save, FileText, Layers, Trash2, Loader2, AlertCircle, ChevronDown, ChevronUp, Link } from 'lucide-react';
import { toast } from 'sonner';
import { useDesigners } from '@/lib/hooks/use-designers';
import { PLAYER_STATUS_CONFIG } from '@/components/features/designs/tags/player-status-tag';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

import type { Design } from '@/lib/types/design';

type CreationMode = 'individual' | 'batch';

// Fila para el modo lote (cada fila es un diseño completo)
interface BulkDesignRow {
  id: string;
  title: string; // Opcional: si vacío, usa el nombre del jugador
  player: string;
  match_home: string;
  match_away: string;
  deadline_at: Date | undefined;
  designer_id: string | null;
  folder_url: string; // Opcional
  player_status: 'injured' | 'suspended' | 'doubt' | 'last_minute' | null; // Opcional
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function createEmptyRow(): BulkDesignRow {
  return {
    id: generateId(),
    title: '',
    player: '',
    match_home: '',
    match_away: '',
    deadline_at: undefined,
    designer_id: null,
    folder_url: '',
    player_status: null,
  };
}

// Validación: solo jugador, equipos y deadline son obligatorios
function isRowValid(row: BulkDesignRow): boolean {
  return !!(
    row.player.trim() &&
    row.match_home.trim() &&
    row.match_away.trim() &&
    row.deadline_at
  );
}

function isRowEmpty(row: BulkDesignRow): boolean {
  return (
    !row.title.trim() &&
    !row.player.trim() &&
    !row.match_home.trim() &&
    !row.match_away.trim() &&
    !row.deadline_at &&
    !row.folder_url.trim()
  );
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

  // Datos para modo lote (filas completas)
  const [bulkRows, setBulkRows] = useState<BulkDesignRow[]>([createEmptyRow()]);
  
  // Toggle para mostrar columnas opcionales (Drive, Estado)
  const [showOptionalColumns, setShowOptionalColumns] = useState(false);

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
      setBulkRows([createEmptyRow()]);
      setCreationMode('individual');
    }
  }, [design, open]);

  const addBulkRow = () => {
    setBulkRows([...bulkRows, createEmptyRow()]);
  };

  const addMultipleBulkRows = (count: number) => {
    const newRows = Array.from({ length: count }, () => createEmptyRow());
    setBulkRows([...bulkRows, ...newRows]);
  };

  const removeBulkRow = (id: string) => {
    if (bulkRows.length > 1) {
      setBulkRows(bulkRows.filter((r) => r.id !== id));
    }
  };

  const updateBulkRow = (id: string, field: keyof BulkDesignRow, value: string | Date | null | undefined) => {
    setBulkRows(
      bulkRows.map((r) =>
        r.id === id ? { ...r, [field]: value } : r
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditMode || creationMode === 'individual') {
        // Modo individual/edición
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
        } else {
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
        }
      } else {
        // Modo lote: usar el nuevo endpoint /api/designs/bulk
        const validRows = bulkRows.filter(isRowValid);
        if (validRows.length === 0) {
          toast.error('Añade al menos un diseño completo');
          setLoading(false);
          return;
        }

        // Validar fechas
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        for (const row of validRows) {
          if (row.deadline_at && row.deadline_at < oneHourAgo) {
            toast.error(`"${row.title}": la fecha no puede ser tan antigua`);
            setLoading(false);
            return;
          }
        }

        const response = await fetch('/api/designs/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            designs: validRows.map((r) => ({
              title: r.title || undefined, // Si vacío, API usa player como fallback
              player: r.player,
              match_home: r.match_home,
              match_away: r.match_away,
              deadline_at: r.deadline_at!.toISOString(),
              designer_id: r.designer_id || undefined,
              folder_url: r.folder_url || undefined,
              player_status: r.player_status || undefined,
            })),
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Error al crear diseños');
        }

        const result = await response.json();
        toast.success(
          `${result.created} diseño${result.created !== 1 ? 's' : ''} creado${result.created !== 1 ? 's' : ''} exitosamente`
        );
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
      setBulkRows([createEmptyRow()]);

      onDesignCreated();
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al crear diseño');
    } finally {
      setLoading(false);
    }
  };

  const validBulkCount = bulkRows.filter(isRowValid).length;
  const hasIncompleteRows = bulkRows.some((r) => !isRowValid(r) && !isRowEmpty(r));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-h-[90vh] overflow-y-auto",
        creationMode === 'batch' && !isEditMode ? "max-w-[95vw]" : "max-w-2xl"
      )}>
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

        <LayoutGroup>
          <form onSubmit={handleSubmit}>
            <motion.div 
              layout
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="space-y-6 mt-4"
            >
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

            {/* Contenido según el modo - con animación suave de Framer Motion */}
            {/* mode="popLayout" permite que layout animations funcionen con AnimatePresence */}
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div 
                key={creationMode}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ 
                  opacity: { duration: 0.2 },
                  layout: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
                }}
                className="space-y-6"
              >
              {(creationMode === 'individual' || isEditMode) ? (
                /* ========== MODO INDIVIDUAL ========== */
                <>
                  <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Información del Partido</CardTitle>
                    <CardDescription>Datos del partido relacionado</CardDescription>
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
              </>
            ) : (
              /* ========== MODO EN LOTE (nuevo sistema con tabla) ========== */
              <>
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">Diseños a Crear</CardTitle>
                      <CardDescription>
                        Campos obligatorios: Jugador, Equipos, Deadline. El título se genera automáticamente si no se rellena.
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowOptionalColumns(!showOptionalColumns)}
                      className="shrink-0"
                    >
                      {showOptionalColumns ? (
                        <>
                          <ChevronUp className="mr-1 h-4 w-4" />
                          Ocultar campos
                        </>
                      ) : (
                        <>
                          <ChevronDown className="mr-1 h-4 w-4" />
                          Más campos
                        </>
                      )}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {/* Tabla con scroll */}
                    <div className="overflow-auto border rounded-lg max-h-[400px]">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 sticky top-0 z-10">
                          <tr className="border-b">
                            <th className="px-2 py-3 text-left font-medium w-8">#</th>
                            <th className="px-2 py-3 text-left font-medium min-w-[140px]">Título</th>
                            <th className="px-2 py-3 text-left font-medium min-w-[120px]">Jugador *</th>
                            <th className="px-2 py-3 text-left font-medium min-w-[100px]">Local *</th>
                            <th className="px-2 py-3 text-left font-medium min-w-[100px]">Visitante *</th>
                            <th className="px-2 py-3 text-left font-medium min-w-[120px]">Diseñador</th>
                            <th className="px-2 py-3 text-left font-medium min-w-[160px]">Deadline *</th>
                            {showOptionalColumns && (
                              <>
                                <th className="px-2 py-3 text-left font-medium min-w-[200px]">
                                  <div className="flex items-center gap-1">
                                    <Link className="h-3 w-3" />
                                    Drive URL
                                  </div>
                                </th>
                                <th className="px-2 py-3 text-left font-medium min-w-[120px]">Estado</th>
                              </>
                            )}
                            <th className="px-2 py-3 w-10"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {bulkRows.map((row, index) => {
                            const valid = isRowValid(row);
                            const empty = isRowEmpty(row);
                            const incomplete = !valid && !empty;

                            return (
                              <tr
                                key={row.id}
                                className={cn(
                                  'border-b transition-colors',
                                  incomplete && 'bg-yellow-500/5',
                                  valid && 'bg-green-500/5'
                                )}
                              >
                                <td className="px-2 py-2">
                                  <span className={cn(
                                    'text-sm font-medium',
                                    incomplete && 'text-yellow-500',
                                    valid && 'text-green-500',
                                    empty && 'text-muted-foreground'
                                  )}>
                                    {index + 1}
                                  </span>
                                </td>
                                <td className="px-1 py-1">
                                  <Input
                                    placeholder="Auto: Jugador"
                                    value={row.title}
                                    onChange={(e) => updateBulkRow(row.id, 'title', e.target.value)}
                                    className="h-8 text-sm"
                                  />
                                </td>
                                <td className="px-1 py-1">
                                  <Input
                                    placeholder="Jugador *"
                                    value={row.player}
                                    onChange={(e) => updateBulkRow(row.id, 'player', e.target.value)}
                                    className="h-8 text-sm"
                                  />
                                </td>
                                <td className="px-1 py-1">
                                  <Input
                                    placeholder="Local *"
                                    value={row.match_home}
                                    onChange={(e) => updateBulkRow(row.id, 'match_home', e.target.value)}
                                    className="h-8 text-sm"
                                  />
                                </td>
                                <td className="px-1 py-1">
                                  <Input
                                    placeholder="Visitante *"
                                    value={row.match_away}
                                    onChange={(e) => updateBulkRow(row.id, 'match_away', e.target.value)}
                                    className="h-8 text-sm"
                                  />
                                </td>
                                <td className="px-1 py-1">
                                  <Select
                                    value={row.designer_id || 'auto'}
                                    onValueChange={(value) =>
                                      updateBulkRow(row.id, 'designer_id', value === 'auto' ? null : value)
                                    }
                                  >
                                    <SelectTrigger className="h-8 text-sm">
                                      <SelectValue placeholder="Auto" />
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
                                </td>
                                <td className="px-1 py-1">
                                  <DateTimePicker
                                    value={row.deadline_at}
                                    onChange={(date) => updateBulkRow(row.id, 'deadline_at', date)}
                                    placeholder="Fecha *"
                                    className="h-8 text-sm"
                                  />
                                </td>
                                {showOptionalColumns && (
                                  <>
                                    <td className="px-1 py-1">
                                      <Input
                                        placeholder="https://drive.google.com/..."
                                        value={row.folder_url}
                                        onChange={(e) => updateBulkRow(row.id, 'folder_url', e.target.value)}
                                        className="h-8 text-sm"
                                      />
                                    </td>
                                    <td className="px-1 py-1">
                                      <Select
                                        value={row.player_status || 'none'}
                                        onValueChange={(value) =>
                                          updateBulkRow(row.id, 'player_status', value === 'none' ? null : value)
                                        }
                                      >
                                        <SelectTrigger className="h-8 text-sm">
                                          <SelectValue placeholder="—" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="none">Sin estado</SelectItem>
                                          {Object.entries(PLAYER_STATUS_CONFIG).map(([key, config]) => (
                                            <SelectItem key={key} value={key}>
                                              <div className="flex items-center gap-2">
                                                <config.icon className="h-3 w-3" />
                                                <span>{config.label}</span>
                                              </div>
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </td>
                                  </>
                                )}
                                <td className="px-1 py-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeBulkRow(row.id)}
                                    disabled={bulkRows.length === 1}
                                    className="h-8 w-8 text-destructive hover:text-destructive/80"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Botones para añadir filas */}
                    <div className="flex items-center gap-2 mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addBulkRow}
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        +1 Fila
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addMultipleBulkRows(5)}
                      >
                        +5 Filas
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addMultipleBulkRows(10)}
                      >
                        +10 Filas
                      </Button>
                      
                      <div className="flex-1" />
                      
                      {hasIncompleteRows && (
                        <div className="flex items-center gap-1 text-sm text-yellow-500">
                          <AlertCircle className="h-4 w-4" />
                          <span>Hay filas incompletas</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
              </motion.div>
            </AnimatePresence>
            </motion.div>

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
              disabled={loading || (creationMode === 'batch' && !isEditMode && validBulkCount === 0)}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : isEditMode ? (
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
                  Crear {validBulkCount} Diseño{validBulkCount !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
        </LayoutGroup>
      </DialogContent>
    </Dialog>
  );
}
