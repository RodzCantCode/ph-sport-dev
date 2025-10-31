import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LoaderProps {
  message?: string;
  className?: string;
  variant?: 'default' | 'skeleton' | 'spinner';
}

export function Loader({
  message = 'Cargando...',
  className,
  variant = 'default',
}: LoaderProps) {
  if (variant === 'skeleton') {
    return (
      <div className={cn('space-y-4', className)}>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (variant === 'spinner') {
    return (
      <div className={cn('flex items-center justify-center p-6', className)}>
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <p className="text-sm text-gray-400">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn('border border-gray-700/30', className)}>
      <CardContent className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <p className="text-gray-400">{message}</p>
        </div>
      </CardContent>
    </Card>
  );
}



