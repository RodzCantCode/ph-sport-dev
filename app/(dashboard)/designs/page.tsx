'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { Edit2, Trash2, ExternalLink, Filter, LayoutGrid, Table2, Search, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { CreateDesignDialog } from '@/components/features/designs/dialogs/create-design-dialog';
import { CreateDesignButton } from '@/components/features/designs/dialogs/create-design-button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageTransition } from '@/components/ui/page-transition';
import { DesignsSkeleton } from '@/components/skeletons/designs-skeleton';
import { KanbanBoard } from '@/components/features/designs/kanban/kanban-board';
import { useDesigners } from '@/lib/hooks/use-designers';
import type { Design } from '@/lib/types/design';
import { STATUS_LABELS } from '@/lib/types/design';
import type { DesignStatus } from '@/lib/types/filters';
import { toast } from 'sonner';
import { getDefaultWeekRange } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { PlayerStatusTag } from '@/components/features/designs/tags/player-status-tag';
import { DesignDetailSheet } from '@/components/features/designs/design-detail-sheet';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DatePicker } from '@/components/ui/date-picker';

// Wrapper component para Suspense boundary requerido por useSearchParams
export default function DesignsPage() {
  return (
    <Suspense fallback={<DesignsSkeleton />}>
      <DesignsPageContent />
    </Suspense>
  );
}

function DesignsPageContent() {
  const [items, setItems] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDesign, setEditingDesign] = useState<Design | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  
  // Estado para el panel de detalles
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  
  // Estado para el diálogo de confirmación de eliminación
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [designToDelete, setDesignToDelete] = useState<Design | null>(null);

  // Hook de diseñadores
  const { designers } = useDesigners();

  // Leer query param ?open para abrir diseño automáticamente
  const searchParams = useSearchParams();
  useEffect(() => {
    const openId = searchParams.get('open');
    if (openId) {
      setSelectedDesignId(openId);
      setDetailSheetOpen(true);
    }
  }, [searchParams]);

  // Filtros
  const [statusFilter, setStatusFilter] = useState<DesignStatus | 'all'>('all');
  const [designerFilter, setDesignerFilter] = useState<string | 'all'>('all');
  const [weekStartFilter, setWeekStartFilter] = useState<Date | undefined>(undefined);
  const [weekEndFilter, setWeekEndFilter] = useState<Date | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Debounce para searchQuery (solo afecta filtrado local, no fetch)
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Paginación y ordenamiento
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<'title' | 'player' | 'deadline' | 'status' | null>('deadline');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const loadDesigns = useCallback(() => {
    setLoading(true);
    setError(null);
    const { weekStart: defaultStart, weekEnd: defaultEnd } = getDefaultWeekRange();
    const weekStart = weekStartFilter ? format(weekStartFilter, 'yyyy-MM-dd') : format(defaultStart, 'yyyy-MM-dd');
    const weekEnd = weekEndFilter ? format(weekEndFilter, 'yyyy-MM-dd') : format(defaultEnd, 'yyyy-MM-dd');

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
        logger.error('Designs fetch error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMessage);
        toast.error(`Error al cargar los diseños: ${errorMessage}`);
      })
      .finally(() => setLoading(false));
  }, [weekStartFilter, weekEndFilter, statusFilter, designerFilter]);

  useEffect(() => {
    // Inicializar filtros de semana
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    setWeekStartFilter(weekStart);
    setWeekEndFilter(weekEnd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Recargar cuando cambian los filtros
    if (weekStartFilter && weekEndFilter) {
      loadDesigns();
    }
  }, [loadDesigns, weekStartFilter, weekEndFilter]);

  const handleEdit = (design: Design) => {
    setEditingDesign(design);
    setEditDialogOpen(true);
  };

  const handleDelete = (design: Design) => {
    setDesignToDelete(design);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!designToDelete) return;

    setDeletingId(designToDelete.id);
    try {
      const response = await fetch(`/api/designs/${designToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar diseño');
      }

      toast.success('Diseño eliminado exitosamente');
      setDeleteConfirmOpen(false);
      setDesignToDelete(null);
      loadDesigns();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar diseño');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setEditingDesign(null);
  };

  const handleWeekFilterApply = () => {
    if (weekStartFilter && weekEndFilter) {
      loadDesigns();
    }
  };

  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      // Toggle direction si es la misma columna
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Nueva columna, empezar con asc
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset a página 1 al ordenar
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

  // Filtrar items localmente basado en searchQuery (usando debounced)
  const filteredItems = items.filter((design) => {
    // Aplicar búsqueda
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      const matchesSearch = (
        design.title.toLowerCase().includes(query) ||
        design.player.toLowerCase().includes(query) ||
        design.match_home.toLowerCase().includes(query) ||
        design.match_away.toLowerCase().includes(query)
      );
      if (!matchesSearch) return false;
    }
    
    return true;
  });

  // Ordenar items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (!sortColumn) return 0;
    
    let comparison = 0;
    
    switch (sortColumn) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'player':
        comparison = a.player.localeCompare(b.player);
        break;
      case 'deadline':
        comparison = new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime();
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Paginar items
  const totalItems = sortedItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = sortedItems.slice(startIndex, endIndex);

  // Error state se maneja dentro del PageTransition
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
    <PageTransition loading={loading && items.length === 0} skeleton={<DesignsSkeleton />}>
      <div className="flex flex-col gap-6 p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Diseños
          </h1>
          <p className="text-muted-foreground">Gestión de todas las piezas gráficas</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-border bg-muted p-1">
            <Button
              type="button"
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="min-w-[90px]"
            >
              <Table2 className="h-4 w-4 mr-2" />
              Tabla
            </Button>
            <Button
              type="button"
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="min-w-[90px]"
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Kanban
            </Button>
          </div>
          <CreateDesignButton onDesignCreated={loadDesigns} />
        </div>
      </div>

      {/* Buscador */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por título, jugador o partido..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros Avanzados
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
                  <SelectItem value="TO_REVIEW">En Revisión</SelectItem>
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
                  {designers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Semana inicio</Label>
              <DatePicker
                value={weekStartFilter}
                onChange={(date) => {
                  setWeekStartFilter(date);
                }}
                placeholder="Fecha inicio"
              />
            </div>
            <div className="grid gap-2">
              <Label>Semana fin</Label>
              <div className="flex gap-2">
                <DatePicker
                  value={weekEndFilter}
                  onChange={(date) => {
                    setWeekEndFilter(date);
                  }}
                  placeholder="Fecha fin"
                  minDate={weekStartFilter}
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
      {filteredItems.length === 0 ? (
        <EmptyState
          title={debouncedSearchQuery ? "No se encontraron resultados" : "No hay diseños programados"}
          description={debouncedSearchQuery ? "Intenta con otros términos de búsqueda" : "Crea tu primer diseño para comenzar"}
          actionLabel={debouncedSearchQuery ? "Limpiar búsqueda" : "Crear Diseño"}
          onAction={() => { 
            if (debouncedSearchQuery) {
              setSearchQuery('');
            } else {
              setEditingDesign(null); 
              setEditDialogOpen(true);
            }
          }}
        />
      ) : viewMode === 'kanban' ? (
        <div className="w-full">
          <KanbanBoard
            designs={sortedItems}
            loading={false}
            onStatusChange={handleStatusChange}
            onCreateDesign={() => { setEditingDesign(null); setEditDialogOpen(true); }}
            designers={designers}
            onCardClick={(designId) => {
              setSelectedDesignId(designId);
              setDetailSheetOpen(true);
            }}
          />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lista de Diseños</CardTitle>
                <CardDescription>
                  {totalItems} diseño{totalItems !== 1 ? 's' : ''} encontrado{totalItems !== 1 ? 's' : ''}
                  {debouncedSearchQuery && ` (filtrado de ${items.length} total${items.length !== 1 ? 'es' : ''})`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Mostrar</Label>
                <Select 
                  value={itemsPerPage.toString()} 
                  onValueChange={(v) => {
                    setItemsPerPage(Number(v));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:text-orange-400 transition-colors select-none"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center gap-1">
                      Título
                      {sortColumn === 'title' && (
                        sortDirection === 'asc' 
                          ? <ArrowUp className="h-4 w-4" />
                          : <ArrowDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-orange-400 transition-colors select-none"
                    onClick={() => handleSort('player')}
                  >
                    <div className="flex items-center gap-1">
                      Contexto
                      {sortColumn === 'player' && (
                        sortDirection === 'asc' 
                          ? <ArrowUp className="h-4 w-4" />
                          : <ArrowDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Diseñador</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-orange-400 transition-colors select-none"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1">
                      Estado
                      {sortColumn === 'status' && (
                        sortDirection === 'asc' 
                          ? <ArrowUp className="h-4 w-4" />
                          : <ArrowDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-orange-400 transition-colors select-none"
                    onClick={() => handleSort('deadline')}
                  >
                    <div className="flex items-center gap-1">
                      Fecha de entrega
                      {sortColumn === 'deadline' && (
                        sortDirection === 'asc' 
                          ? <ArrowUp className="h-4 w-4" />
                          : <ArrowDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.map((design) => {
                  const designer = designers.find(d => d.id === design.designer_id);
                  
                  // Calcular tiempo restante hasta deadline
                  const now = new Date();
                  const deadline = new Date(design.deadline_at);
                  const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
                  const isUrgent = hoursUntilDeadline < 48 && hoursUntilDeadline > 0 && design.status !== 'DELIVERED';
                  const isCritical = hoursUntilDeadline < 24 && hoursUntilDeadline > 0 && design.status !== 'DELIVERED';
                  
                  return (
                    <TableRow key={design.id}>
                      <TableCell className="font-medium">
                        <button
                          onClick={() => {
                            setSelectedDesignId(design.id);
                            setDetailSheetOpen(true);
                          }}
                          className="hover:text-primary transition-colors text-left"
                        >
                          {design.title}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{design.player}</span>
                            {design.player_status && <PlayerStatusTag status={design.player_status} variant="compact" />}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {design.match_home} vs {design.match_away}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {designer ? (
                          <div className="flex items-center gap-2" title={designer.name}>
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                              {designer.name.charAt(0)}
                            </div>
                            <span className="text-sm truncate max-w-[100px]">{designer.name.split(' ')[0]}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge status={design.status} className="h-6">
                            {STATUS_LABELS[design.status]}
                          </Badge>
                          {isCritical && (
                            <Badge variant="destructive" className="animate-pulse-slow h-6 px-1.5">
                              🔥 {Math.floor(hoursUntilDeadline)}h
                            </Badge>
                          )}
                          {isUrgent && !isCritical && (
                            <Badge className="bg-yellow-500/30 text-yellow-400 border-yellow-500/50 h-6 px-1.5">
                              ⚠️
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span>{format(new Date(design.deadline_at), "dd MMM", { locale: es })}</span>
                          <span className="text-xs text-muted-foreground">{format(new Date(design.deadline_at), "HH:mm")}</span>
                        </div>
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
                                aria-label="Abrir carpeta Drive"
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
                            aria-label="Editar diseño"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(design)}
                            disabled={deletingId === design.id}
                            title="Eliminar diseño"
                            aria-label="Eliminar diseño"
                            className="text-destructive hover:text-destructive/80"
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
            
            {/* Controles de paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Mostrando {startIndex + 1}-{Math.min(endIndex, totalItems)} de {totalItems}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <span className="flex items-center px-3 text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <CreateDesignDialog
        open={editDialogOpen}
        onOpenChange={handleEditDialogClose}
        onDesignCreated={loadDesigns}
        design={editingDesign}
      />

      <DesignDetailSheet
        designId={selectedDesignId}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        onDesignUpdated={loadDesigns}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => {
          setDeleteConfirmOpen(open);
          if (!open) setDesignToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Eliminar diseño"
        description={designToDelete ? `¿Estás seguro de que quieres eliminar "${designToDelete.title}"? Esta acción no se puede deshacer.` : ''}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        loading={deletingId !== null}
      />
    </div>
    </PageTransition>
  );
}
