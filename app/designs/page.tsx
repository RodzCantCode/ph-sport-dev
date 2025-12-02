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
import { Plus, Edit2, Trash2, ExternalLink, Filter, LayoutGrid, Table2, Search, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { CreateDesignDialog } from '@/components/features/designs/dialogs/create-design-dialog';
import { Loader } from '@/components/ui/loader';
import { EmptyState } from '@/components/ui/empty-state';
import { KanbanBoard } from '@/components/features/designs/kanban/kanban-board';
import { useDesigners } from '@/lib/hooks/use-designers';
import type { Design } from '@/lib/types/design';
import { STATUS_LABELS } from '@/lib/types/design';
import type { DesignStatus } from '@/lib/types/filters';
import { toast } from 'sonner';
import Link from 'next/link';
import { cn, getDefaultWeekRange } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { PlayerStatusTag } from '@/components/features/designs/tags/player-status-tag';

export default function DesignsPage() {
  const [items, setItems] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDesign, setEditingDesign] = useState<Design | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Hook de diseñadores
  const { designers, loading: loadingDesigners } = useDesigners();

  // Filtros
  const [statusFilter, setStatusFilter] = useState<DesignStatus | 'all'>('all');
  const [designerFilter, setDesignerFilter] = useState<string | 'all'>('all');
  const [weekStartFilter, setWeekStartFilter] = useState<string>('');
  const [weekEndFilter, setWeekEndFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Debounce para searchQuery (solo afecta filtrado local, no fetch)
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Paginación y ordenamiento
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<'title' | 'player' | 'deadline' | 'status' | null>('deadline');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const loadDesigns = () => {
    setLoading(true);
    setError(null);
    const { weekStart: defaultStart, weekEnd: defaultEnd } = getDefaultWeekRange();
    const weekStart = weekStartFilter || format(defaultStart, 'yyyy-MM-dd');
    const weekEnd = weekEndFilter || format(defaultEnd, 'yyyy-MM-dd');

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
    // Necesario: Este efecto solo debe ejecutarse una vez al montar el componente
    // para inicializar los filtros. loadDesigns depende de filtros que se establecen aquí.
  }, []);

  useEffect(() => {
    // Recargar cuando cambian los filtros
    if (weekStartFilter && weekEndFilter) {
      loadDesigns();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Necesario: loadDesigns depende de filtros que cambian dinámicamente.
    // Incluir loadDesigns en dependencias causaría un loop infinito.
    // TODO: Refactorizar para incluir loadDesigns en dependencias de forma segura usando useCallback.
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
          <p className="text-gray-600 dark:text-gray-400">Gestión de todas las piezas gráficas</p>
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
                  : 'text-gray-600 dark:text-gray-400'
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
                  : 'text-gray-600 dark:text-gray-400'
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

      {/* Buscador */}
      <Card className="animate-slide-up">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600 dark:text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por título, jugador o partido..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 dark:bg-white/5 border-orange-200/20 dark:border-white/10 text-gray-800 dark:text-gray-200 placeholder:text-gray-500 focus:bg-white/10 focus:border-orange-500/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card className="animate-slide-up">
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
                  {designers.map((user) => (
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
              setDialogOpen(true);
            }
          }}
        />
      ) : viewMode === 'kanban' ? (
        <div className="animate-slide-up w-full">
          <KanbanBoard
            designs={sortedItems}
            loading={false}
            onStatusChange={handleStatusChange}
            onCreateDesign={() => { setEditingDesign(null); setDialogOpen(true); }}
            designers={designers}
          />
        </div>
      ) : (
        <Card className="animate-slide-up">
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
                <Label className="text-sm text-gray-600 dark:text-gray-400">Mostrar</Label>
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
                      Deadline
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
                        <Link href={`/designs/${design.id}`} className="hover:text-orange-400 transition-colors">
                          {design.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{design.player}</span>
                            {design.player_status && <PlayerStatusTag status={design.player_status} variant="compact" />}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {design.match_home} vs {design.match_away}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {designer ? (
                          <div className="flex items-center gap-2" title={designer.name}>
                            <div className="h-6 w-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-xs font-medium text-orange-700 dark:text-orange-300">
                              {designer.name.charAt(0)}
                            </div>
                            <span className="text-sm truncate max-w-[100px]">{designer.name.split(' ')[0]}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge status={design.status} className="h-6">
                            {STATUS_LABELS[design.status]}
                          </Badge>
                          {isCritical && (
                            <Badge variant="destructive" className="animate-pulse h-6 px-1.5">
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
                          <span className="text-xs text-gray-500">{format(new Date(design.deadline_at), "HH:mm")}</span>
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
                            onClick={() => handleDelete(design.id)}
                            disabled={deletingId === design.id}
                            title="Eliminar diseño"
                            aria-label="Eliminar diseño"
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
            
            {/* Controles de paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                <p className="text-sm text-gray-600 dark:text-gray-400">
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
                  <span className="flex items-center px-3 text-sm text-gray-600 dark:text-gray-400">
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
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        onDesignCreated={loadDesigns}
        design={editingDesign}
      />
    </div>
  );
}
