'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import { toast } from 'sonner';
import type { DesignStatus } from '@/lib/types/filters';

interface DesignItem {
  id: string;
  title: string;
  status: DesignStatus;
  designer_id?: string;
  deadline_at: string;
}

export default function DashboardPage() {
  const [items, setItems] = useState<DesignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  const loadDashboard = () => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7); // rango más amplio para DEMO
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 21);

    const qs = new URLSearchParams({
      weekStart: format(weekStart, 'yyyy-MM-dd'),
      weekEnd: format(weekEnd, 'yyyy-MM-dd'),
    });
    fetch(`/api/designs?${qs.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        console.log('Dashboard fetch result:', data);
        setItems(data.items || []);
      })
      .catch((err) => {
        console.error('Dashboard fetch error:', err);
        setItems([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleAssign = async () => {
    setAssigning(true);
    try {
      const response = await fetch('/api/designs/assign', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al repartir diseños');
      }

      const result = await response.json();
      toast.success(result.message || 'Diseños repartidos exitosamente');
      loadDashboard(); // Recargar datos
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al repartir diseños');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">Cargando...</div>
    );
  }

  const statusCount = items.reduce<Record<string, number>>((acc, it) => {
    acc[it.status] = (acc[it.status] || 0) + 1;
    return acc;
  }, {});

  const risky = items.filter((it) => {
    const t = new Date(it.deadline_at).getTime();
    const soon = t - Date.now() < 24 * 60 * 60 * 1000;
    return soon && it.status !== 'TO_REVIEW' && it.status !== 'DELIVERED';
  });

  const unassignedCount = items.filter((it) => !it.designer_id).length;

  return (
    <div className="flex flex-col gap-6 p-6 animate-fade-in">
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-700 to-orange-600 bg-clip-text text-transparent mb-2">
            Dashboard del Equipo
          </h1>
          <p className="text-gray-400">Vista general del equipo de diseño</p>
        </div>
        {unassignedCount > 0 && (
          <Button onClick={handleAssign} disabled={assigning} className="animate-slide-up">
            <Users className="mr-2 h-4 w-4" />
            {assigning ? 'Repartiendo...' : `Repartir (${unassignedCount} sin asignar)`}
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="animate-slide-up [animation-delay:0.1s]">
          <CardHeader>
            <CardTitle className="text-orange-700">Backlog</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-orange-600">{statusCount['BACKLOG'] || 0}</div>
          </CardContent>
        </Card>
        <Card className="animate-slide-up [animation-delay:0.2s]">
          <CardHeader>
            <CardTitle className="text-orange-700">En curso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-orange-600">{statusCount['IN_PROGRESS'] || 0}</div>
          </CardContent>
        </Card>
        <Card className="animate-slide-up [animation-delay:0.3s]">
          <CardHeader>
            <CardTitle className="text-orange-700">Por revisar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-orange-600">{statusCount['TO_REVIEW'] || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="animate-slide-up [animation-delay:0.4s]">
        <CardHeader>
          <CardTitle className="text-orange-700">En riesgo (&lt;24h)</CardTitle>
        </CardHeader>
        <CardContent>
          {risky.length === 0 ? (
            <div className="text-sm text-gray-400">Sin diseños en riesgo</div>
          ) : (
            <div className="grid gap-3">
              {risky.map((it, index) => (
                <div 
                  key={it.id} 
                  className="flex items-center justify-between rounded-lg border border-red-500/30 bg-red-900/20 backdrop-blur-sm p-4 hover-lift glass-effect"
                  style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                >
                  <div className="font-medium text-gray-200">{it.title}</div>
                  <Badge variant="destructive" className="animate-pulse-slow">{new Date(it.deadline_at).toLocaleString()}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

