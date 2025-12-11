import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  icon?: LucideIcon;
  className?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

export function KpiCard({
  title,
  value,
  description,
  trend,
  icon: Icon,
  className,
  variant = 'default',
}: KpiCardProps) {
  const variantStyles = {
    default: 'text-primary',
    primary: 'text-blue-700 dark:text-blue-400',
    success: 'text-green-700 dark:text-green-400',
    warning: 'text-yellow-700 dark:text-yellow-400',
    danger: 'text-red-700 dark:text-red-400',
  };

  return (
    <Card className={cn('animate-slide-up', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className={cn('text-sm font-medium', variantStyles[variant])}>
            {title}
          </CardTitle>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold text-primary">{value}</div>
        {description && (
          <p className="text-sm text-muted-foreground mt-2">{description}</p>
        )}
        {trend && (
          <div className="mt-2">
            <p
              className={cn(
                'text-xs',
                trend.isPositive ? 'text-green-500' : 'text-red-500'
              )}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value} {trend.label}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}



