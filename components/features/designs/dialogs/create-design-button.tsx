'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreateDesignDialog } from './create-design-dialog';
import type { Design } from '@/lib/types/design';

interface CreateDesignButtonProps {
  /** Diseño a editar (modo edición) */
  editDesign?: Design | null;
  /** Callback cuando se crea/edita un diseño */
  onDesignCreated: () => void;
  /** Variante del botón */
  variant?: 'default' | 'outline' | 'ghost';
  /** Tamaño del botón */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** Clase CSS adicional */
  className?: string;
}

export function CreateDesignButton({
  editDesign = null,
  onDesignCreated,
  variant = 'default',
  size = 'default',
  className,
}: CreateDesignButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setDialogOpen(true)}
      >
        <Plus className="mr-2 h-4 w-4" />
        {editDesign ? 'Editar Diseño' : 'Crear Diseño'}
      </Button>

      <CreateDesignDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onDesignCreated={onDesignCreated}
        design={editDesign}
      />
    </>
  );
}
