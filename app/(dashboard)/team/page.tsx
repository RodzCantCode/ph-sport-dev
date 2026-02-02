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
import { DesignerCard } from '@/components/features/team/designer-card';
import { DesignerDetailSheet } from '@/components/features/team/designer-detail-sheet';
import { TeamSkeleton } from '@/components/skeletons/team-skeleton';
import { useTeamData, type DesignerWithDesigns } from '@/lib/hooks/use-team-data';

export default function TeamPage() {
  const router = useRouter();
  const { profile, status } = useAuth();
  const authLoading = status === 'INITIALIZING';
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [selectedDesigner, setSelectedDesigner] = useState<DesignerWithDesigns | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Calcular rango de la semana seleccionada (lunes a domingo)
  const weekStart = useMemo(() => startOfWeek(selectedWeek, { weekStartsOn: 1 }), [selectedWeek]);
  const weekEnd = useMemo(() => endOfWeek(selectedWeek, { weekStartsOn: 1 }), [selectedWeek]);

  // Use SWR hook for team data
  const { designers, isLoading } = useTeamData(weekStart, weekEnd);

  // Redireccionar si no es admin
  useEffect(() => {
    if (!authLoading && profile && profile.role !== 'ADMIN') {
      router.replace('/my-week');
    }
  }, [authLoading, profile, router]);

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

  // Only show skeleton on initial load (no cached data yet)
  const showSkeleton = (isLoading && designers.length === 0) || authLoading;

  return (
    <PageTransition loading={showSkeleton} skeleton={<TeamSkeleton />}>
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
