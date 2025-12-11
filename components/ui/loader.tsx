import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LoaderProps {
  message?: string;
  className?: string;
  variant?: 'default' | 'skeleton';
}

export function Loader({
  message,
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

  // Default: Centered spinner filling available space
  return (
    <div className={cn('flex flex-1 items-center justify-center h-[calc(100vh-8rem)]', className)}>
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
      </div>
    </div>
  );
}
