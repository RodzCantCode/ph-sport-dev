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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Table, Layers, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useDesigners } from '@/lib/hooks/use-designers';
import { cn } from '@/lib/utils';

interface DesignRow {
  id: string;
  title: string;
  player: string;
  match_home: string;
  match_away: string;
  deadline_at: Date | undefined;
  designer_id: string | null;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function createEmptyRow(): DesignRow {
  return {
    id: generateId(),
    title: '',
    player: '',
    match_home: '',
    match_away: '',
    deadline_at: undefined,
    designer_id: null,
  };
}

function isRowValid(row: DesignRow): boolean {
  return !!(
    row.title.trim() &&
    row.player.trim() &&
    row.match_home.trim() &&
    row.match_away.trim() &&
    row.deadline_at
  );
}

function isRowEmpty(row: DesignRow): boolean {
  return (
    !row.title.trim() &&
    !row.player.trim() &&
    !row.match_home.trim() &&
    !row.match_away.trim() &&
    !row.deadline_at
  );
}

interface BulkDesignCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDesignsCreated: () => void;
}

export function BulkDesignCreator({
  open,
  onOpenChange,
  onDesignsCreated,
}: BulkDesignCreatorProps) {
  const [loading, setLoading] = useState(false);
  const { designers, loading: loadingDesigners } = useDesigners();
  const [rows, setRows] = useState<DesignRow[]>([createEmptyRow()]);

  const addRow = () => {
    setRows([...rows, createEmptyRow()]);
  };

  const addMultipleRows = (count: number) => {
    const newRows = Array.from({ length: count }, () => createEmptyRow());
    setRows([...rows, ...newRows]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter((r) => r.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof DesignRow, value: string | Date | null | undefined) => {
    setRows(
      rows.map((r) =>
        r.id === id ? { ...r, [field]: value } : r
      )
    );
  };

  const resetForm = () => {
    setRows([createEmptyRow()]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validRows = rows.filter(isRowValid);
    if (validRows.length === 0) {
      toast.error('Añade al menos un diseño completo');
      return;
    }

    // Validar fechas
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    for (const row of validRows) {
      if (row.deadline_at && row.deadline_at < oneHourAgo) {
        toast.error(`"${row.title}": la fecha no puede ser tan antigua`);
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch('/api/designs/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designs: validRows.map((r) => ({
            title: r.title,
            player: r.player,
            match_home: r.match_home,
            match_away: r.match_away,
            deadline_at: r.deadline_at!.toISOString(),
            designer_id: r.designer_id || undefined,
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

      resetForm();
      onDesignsCreated();
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al crear diseños');
    } finally {
      setLoading(false);
    }
  };

  const validCount = rows.filter(isRowValid).length;
  const hasIncompleteRows = rows.some((r) => !isRowValid(r) && !isRowEmpty(r));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3">
            <Table className="h-6 w-6 text-primary" />
            Crear Diseños en Lote
          </DialogTitle>
          <DialogDescription>
            Añade múltiples diseños en una sola tabla. Cada fila es un diseño independiente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Table container with scroll */}
          <div className="flex-1 overflow-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0 z-10">
                <tr className="border-b">
                  <th className="px-2 py-3 text-left font-medium w-8">#</th>
                  <th className="px-2 py-3 text-left font-medium min-w-[180px]">Título *</th>
                  <th className="px-2 py-3 text-left font-medium min-w-[140px]">Jugador *</th>
                  <th className="px-2 py-3 text-left font-medium min-w-[120px]">Local *</th>
                  <th className="px-2 py-3 text-left font-medium min-w-[120px]">Visitante *</th>
                  <th className="px-2 py-3 text-left font-medium min-w-[160px]">Diseñador</th>
                  <th className="px-2 py-3 text-left font-medium min-w-[200px]">Deadline *</th>
                  <th className="px-2 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
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
                          placeholder="Título del diseño"
                          value={row.title}
                          onChange={(e) => updateRow(row.id, 'title', e.target.value)}
                          className="h-9"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <Input
                          placeholder="Jugador/Equipo"
                          value={row.player}
                          onChange={(e) => updateRow(row.id, 'player', e.target.value)}
                          className="h-9"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <Input
                          placeholder="Equipo local"
                          value={row.match_home}
                          onChange={(e) => updateRow(row.id, 'match_home', e.target.value)}
                          className="h-9"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <Input
                          placeholder="Equipo visitante"
                          value={row.match_away}
                          onChange={(e) => updateRow(row.id, 'match_away', e.target.value)}
                          className="h-9"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <Select
                          value={row.designer_id || 'auto'}
                          onValueChange={(value) =>
                            updateRow(row.id, 'designer_id', value === 'auto' ? null : value)
                          }
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Automático" />
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
                          onChange={(date) => updateRow(row.id, 'deadline_at', date)}
                          placeholder="Fecha y hora"
                          className="h-9"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRow(row.id)}
                          disabled={rows.length === 1}
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

          {/* Actions row */}
          <div className="flex items-center gap-2 py-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRow}
            >
              <Plus className="mr-1 h-4 w-4" />
              +1 Fila
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addMultipleRows(5)}
            >
              <Plus className="mr-1 h-4 w-4" />
              +5 Filas
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addMultipleRows(10)}
            >
              <Plus className="mr-1 h-4 w-4" />
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

          <DialogFooter>
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
