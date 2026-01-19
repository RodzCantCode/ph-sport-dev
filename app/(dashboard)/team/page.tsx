'use client';

import { useEffect, useState, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/ui/page-transition';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import { DesignerCard } from '@/components/features/team/designer-card';
import { DesignerDetailSheet } from '@/components/features/team/designer-detail-sheet';
import { TeamSkeleton } from '@/components/skeletons/team-skeleton';
import type { Design } from '@/lib/types/design';

interface DesignerWithDesigns {
  id: string;
  full_name: string;
  designs: Design[];
}

export default function TeamPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [designers, setDesigners] = useState<DesignerWithDesigns[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [selectedDesigner, setSelectedDesigner] = useState<DesignerWithDesigns | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Calcular rango de la semana seleccionada (lunes a domingo)
  const weekStart = useMemo(() => startOfWeek(selectedWeek, { weekStartsOn: 1 }), [selectedWeek]);
  const weekEnd = useMemo(() => endOfWeek(selectedWeek, { weekStartsOn: 1 }), [selectedWeek]);

  // Redireccionar si no es admin
  useEffect(() => {
    if (!authLoading && profile && profile.role !== 'ADMIN') {
      router.replace('/my-week');
    }
  }, [authLoading, profile, router]);

  // Cargar datos del equipo
  useEffect(() => {
    const loadTeamData = async () => {
      if (authLoading || !profile || profile.role !== 'ADMIN') return;

      setLoading(true);
      try {
        const supabase = createClient();

        // 1. Obtener todos los diseñadores
        const { data: designersData, error: designersError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('role', 'DESIGNER');

        if (designersError) throw designersError;

        // 2. Obtener diseños de la semana
        const { data: designsData, error: designsError } = await supabase
          .from('designs')
          .select('*')
          .gte('deadline_at', format(weekStart, 'yyyy-MM-dd'))
          .lte('deadline_at', format(weekEnd, 'yyyy-MM-dd\'T\'23:59:59'));

        if (designsError) throw designsError;

        // 3. Agrupar diseños por diseñador
        const designerMap = new Map<string, DesignerWithDesigns>();
        
        (designersData || []).forEach(d => {
          designerMap.set(d.id, {
            id: d.id,
            full_name: d.full_name || 'Sin nombre',
            designs: [],
          });
        });

        (designsData || []).forEach(design => {
          if (design.designer_id && designerMap.has(design.designer_id)) {
            designerMap.get(design.designer_id)!.designs.push(design);
          }
        });

        setDesigners(Array.from(designerMap.values()));
      } catch (err) {
        logger.error('Error loading team data:', err);
        toast.error('Error al cargar datos del equipo');
      } finally {
        setLoading(false);
      }
    };

    loadTeamData();
  }, [authLoading, profile, weekStart, weekEnd]);

  const handleDesignerClick = (designer: DesignerWithDesigns) => {
    setSelectedDesigner(designer);
    setSheetOpen(true);
  };

  const handlePrevWeek = () => setSelectedWeek(prev => subWeeks(prev, 1));
  const handleNextWeek = () => setSelectedWeek(prev => addWeeks(prev, 1));
  const handleCurrentWeek = () => setSelectedWeek(new Date());

  // Si no es admin, no renderizar nada (se redireccionará)
  if (!authLoading && profile && profile.role !== 'ADMIN') {
    return null;
  }

  const weekLabel = `${format(weekStart, "d 'de' MMM", { locale: es })} - ${format(weekEnd, "d 'de' MMM", { locale: es })}`;
  const isCurrentWeek = format(weekStart, 'yyyy-MM-dd') === format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  return (
    <PageTransition loading={loading || authLoading} skeleton={<TeamSkeleton />}>
      <div className="flex flex-col gap-6 p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              Equipo
            </h1>
            <p className="text-muted-foreground">Supervisa el progreso de tu equipo</p>
          </div>

          {/* Selector de semana */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant={isCurrentWeek ? 'default' : 'outline'} 
              onClick={handleCurrentWeek}
              className="min-w-[180px]"
            >
              {weekLabel}
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Grid de diseñadores */}
        {designers.length === 0 ? (
          <Card>
            <CardContent className="flex h-64 items-center justify-center">
              <p className="text-muted-foreground">No hay diseñadores registrados</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {designers.map(designer => (
              <DesignerCard
                key={designer.id}
                designer={designer}
                onClick={() => handleDesignerClick(designer)}
              />
            ))}
          </div>
        )}

        {/* Sheet de detalle */}
        <DesignerDetailSheet
          designer={selectedDesigner}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          weekLabel={weekLabel}
        />
      </div>
    </PageTransition>
  );
}
