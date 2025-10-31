import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = 'Error',
  message = 'Ha ocurrido un error. Por favor, intenta de nuevo.',
  onRetry,
  retryLabel = 'Reintentar',
  className,
}: ErrorStateProps) {
  return (
    <Card className={cn('border border-red-500/30 bg-red-900/20 backdrop-blur-sm', className)}>
      <CardContent className="flex h-64 items-center justify-center">
        <div className="text-center space-y-3">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <div>
            <p className="font-medium text-gray-200">{title}</p>
            <p className="text-sm text-gray-400 mt-1">{message}</p>
          </div>
          {onRetry && (
            <Button variant="outline" onClick={onRetry} className="mt-4">
              {retryLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}



