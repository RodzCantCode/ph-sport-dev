'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    } catch (error: any) {
      toast.error(error.message || 'Error al repartir diseños');
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
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard del Equipo</h1>
          <p className="text-muted-foreground">Vista general del equipo de diseño</p>
        </div>
        {unassignedCount > 0 && (
          <Button onClick={handleAssign} disabled={assigning}>
            <Users className="mr-2 h-4 w-4" />
            {assigning ? 'Repartiendo...' : `Repartir (${unassignedCount} sin asignar)`}
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Backlog</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statusCount['BACKLOG'] || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>En curso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statusCount['IN_PROGRESS'] || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Por revisar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statusCount['TO_REVIEW'] || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>En riesgo (&lt;24h)</CardTitle>
        </CardHeader>
        <CardContent>
          {risky.length === 0 ? (
            <div className="text-sm text-muted-foreground">Sin diseños en riesgo</div>
          ) : (
            <div className="grid gap-2">
              {risky.map((it) => (
                <div key={it.id} className="flex items-center justify-between rounded border p-3">
                  <div className="font-medium">{it.title}</div>
                  <Badge variant="destructive">{new Date(it.deadline_at).toLocaleString()}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


