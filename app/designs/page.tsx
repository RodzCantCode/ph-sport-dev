'use client';

import { useEffect, useState } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit2, Trash2, ExternalLink, Filter, LayoutGrid, Table2 } from 'lucide-react';
import { CreateDesignDialog } from '@/components/features/designs/dialogs/create-design-dialog';
import { Loader } from '@/components/ui/loader';
import { EmptyState } from '@/components/ui/empty-state';
import { KanbanBoard } from '@/components/features/designs/kanban/kanban-board';
import { mockUsers } from '@/lib/data/mock-data';
import type { Design } from '@/lib/types/design';
import { STATUS_LABELS } from '@/lib/types/design';
import type { DesignStatus } from '@/lib/types/filters';
import { toast } from 'sonner';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function DesignsPage() {
  const [items, setItems] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDesign, setEditingDesign] = useState<Design | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Filtros
  const [statusFilter, setStatusFilter] = useState<DesignStatus | 'all'>('all');
  const [designerFilter, setDesignerFilter] = useState<string | 'all'>('all');
  const [weekStartFilter, setWeekStartFilter] = useState<string>('');
  const [weekEndFilter, setWeekEndFilter] = useState<string>('');

  const loadDesigns = () => {
    setLoading(true);
    setError(null);
    const now = new Date();
    const weekStart = weekStartFilter || format(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
    const weekEnd = weekEndFilter || format(new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

    const qs = new URLSearchParams({
      weekStart,
      weekEnd,
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
      ...(designerFilter !== 'all' ? { designerId: designerFilter } : {}),
    });
    fetch(`/api/designs?${qs.toString()}`)
      .then((r) => {
        if (!r.ok) throw new Error('Error al cargar diseños');
        return r.json();
      })
      .then((data) => setItems(data.items || []))
      .catch((err) => {
        console.error('Designs fetch error:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // Inicializar filtros de semana
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    setWeekStartFilter(format(weekStart, 'yyyy-MM-dd'));
    setWeekEndFilter(format(weekEnd, 'yyyy-MM-dd'));
    loadDesigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Recargar cuando cambian los filtros
    if (weekStartFilter && weekEndFilter) {
      loadDesigns();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, designerFilter, weekStartFilter, weekEndFilter]);

  const handleEdit = (design: Design) => {
    setEditingDesign(design);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este diseño?')) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/designs/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar diseño');
      }

      toast.success('Diseño eliminado exitosamente');
      loadDesigns();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar diseño');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingDesign(null);
  };

  const handleWeekFilterApply = () => {
    if (weekStartFilter && weekEndFilter) {
      loadDesigns();
    }
  };

  const handleStatusChange = async (designId: string, newStatus: DesignStatus) => {
    try {
      const response = await fetch(`/api/designs/${designId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar estado');
      }

      // Actualizar estado local optimísticamente
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === designId ? { ...item, status: newStatus } : item
        )
      );
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar estado');
      // Recargar para revertir cambios
      loadDesigns();
      throw error;
    }
  };

  if (loading && items.length === 0) return <Loader className="p-6" />;

  if (error && items.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          title="Error al cargar diseños"
          description={error}
          actionLabel="Reintentar"
          onAction={loadDesigns}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 animate-fade-in max-w-7xl mx-auto">
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-700 to-orange-600 bg-clip-text text-transparent mb-2">
            Diseños
          </h1>
          <p className="text-gray-400">Gestión de todas las piezas gráficas</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative inline-flex items-center gap-2 rounded-lg glass-effect p-1">
            {/* Slider deslizante - usando translateX para mejor animación */}
            <div
              className={cn(
                'absolute inset-y-1 rounded-md bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-300 ease-in-out',
                viewMode === 'table' 
                  ? 'left-1 right-[calc(50%+4px)]' 
                  : 'right-1 left-[calc(50%+4px)]'
              )}
            />
            
            {/* Botones - mismo ancho, sin hover effect */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('table')}
              className={cn(
                'relative z-10 min-w-[100px] transition-colors duration-300',
                'hover:bg-transparent hover:text-current',
                viewMode === 'table' 
                  ? 'text-white' 
                  : 'text-gray-400'
              )}
            >
              <Table2 className="h-5 w-5 mr-2" />
              Tabla
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('kanban')}
              className={cn(
                'relative z-10 min-w-[100px] transition-colors duration-300',
                'hover:bg-transparent hover:text-current',
                viewMode === 'kanban' 
                  ? 'text-white' 
                  : 'text-gray-400'
              )}
            >
              <LayoutGrid className="h-5 w-5 mr-2" />
              Kanban
            </Button>
          </div>
          <Button onClick={() => { setEditingDesign(null); setDialogOpen(true); }} className="animate-slide-up">
            <Plus className="mr-2 h-4 w-4" />
            Crear Diseño
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="grid gap-2">
              <Label htmlFor="status-filter">Estado</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as DesignStatus | 'all')}>
                <SelectTrigger id="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="BACKLOG">Pendiente</SelectItem>
                  <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                  <SelectItem value="TO_REVIEW">Por Revisar</SelectItem>
                  <SelectItem value="DELIVERED">Entregado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="designer-filter">Diseñador</Label>
              <Select value={designerFilter} onValueChange={(v) => setDesignerFilter(v)}>
                <SelectTrigger id="designer-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {mockUsers.filter(u => u.role === 'designer').map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="week-start">Semana inicio</Label>
              <Input
                id="week-start"
                type="date"
                value={weekStartFilter}
                onChange={(e) => setWeekStartFilter(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="week-end">Semana fin</Label>
              <div className="flex gap-2">
                <Input
                  id="week-end"
                  type="date"
                  value={weekEndFilter}
                  onChange={(e) => setWeekEndFilter(e.target.value)}
                />
                <Button onClick={handleWeekFilterApply} size="sm">
                  Aplicar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vista Tabla o Kanban */}
      {items.length === 0 ? (
        <EmptyState
          title="No hay diseños programados"
          description="Crea tu primer diseño para comenzar"
          actionLabel="Crear Diseño"
          onAction={() => { setEditingDesign(null); setDialogOpen(true); }}
        />
      ) : viewMode === 'kanban' ? (
        <div className="animate-slide-up w-full">
          <KanbanBoard
            designs={items}
            loading={false}
            onStatusChange={handleStatusChange}
            onCreateDesign={() => { setEditingDesign(null); setDialogOpen(true); }}
          />
        </div>
      ) : (
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>Lista de Diseños</CardTitle>
            <CardDescription>{items.length} diseño{items.length !== 1 ? 's' : ''} encontrado{items.length !== 1 ? 's' : ''}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Jugador/Equipo</TableHead>
                  <TableHead>Partido</TableHead>
                  <TableHead>Diseñador</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((design) => {
                  const designer = design.designer_id 
                    ? mockUsers.find((u) => u.id === design.designer_id)
                    : null;
                  return (
                    <TableRow key={design.id}>
                      <TableCell className="font-medium">
                        <Link href={`/designs/${design.id}`} className="hover:text-orange-400 transition-colors">
                          {design.title}
                        </Link>
                      </TableCell>
                      <TableCell>{design.player}</TableCell>
                      <TableCell>
                        {design.match_home} vs {design.match_away}
                      </TableCell>
                      <TableCell>
                        {designer ? designer.name : <span className="text-gray-500">Sin asignar</span>}
                      </TableCell>
                      <TableCell>
                        <Badge status={design.status}>
                          {STATUS_LABELS[design.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(design.deadline_at), "dd 'de' MMMM, yyyy HH:mm", { locale: es })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {design.folder_url && (
                            <Button variant="ghost" size="sm" asChild>
                              <a
                                href={design.folder_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Abrir carpeta Drive"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(design)}
                            title="Editar diseño"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(design.id)}
                            disabled={deletingId === design.id}
                            title="Eliminar diseño"
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <CreateDesignDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        onDesignCreated={loadDesigns}
        design={editingDesign}
      />
    </div>
  );
}
