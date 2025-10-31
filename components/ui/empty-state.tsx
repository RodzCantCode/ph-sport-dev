import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
}

export function EmptyState({
  title = 'No hay elementos',
  description,
  actionLabel,
  onAction,
  actionHref,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn('border border-gray-700/30', className)}>
      <CardContent className="flex h-64 items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-gray-400">{description || title}</p>
          {(actionLabel && onAction) || actionHref ? (
            <div>
              {onAction ? (
                <Button onClick={onAction}>{actionLabel}</Button>
              ) : actionHref ? (
                <Button asChild>
                  <a href={actionHref}>{actionLabel}</a>
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}



