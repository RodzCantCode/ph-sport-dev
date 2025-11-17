import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md',
        secondary:
          'border-transparent bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300',
        destructive:
          'border-transparent bg-red-500 text-white shadow-md',
        outline: 'border-orange-300 dark:border-orange-500/50 text-orange-700 dark:text-orange-300',
      },
      status: {
        BACKLOG: 'border-gray-500/50 dark:border-gray-500/50 bg-gray-500/20 dark:bg-gray-500/20 text-gray-700 dark:text-gray-300',
        IN_PROGRESS: 'border-orange-500/50 bg-orange-500/30 dark:bg-orange-500/30 text-orange-700 dark:text-orange-400',
        TO_REVIEW: 'border-yellow-500/50 bg-yellow-500/30 dark:bg-yellow-500/30 text-yellow-700 dark:text-yellow-400',
        DELIVERED: 'border-green-500/50 bg-green-500/30 dark:bg-green-500/30 text-green-700 dark:text-green-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, status, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, status }), className)} {...props} />;
}

export { Badge, badgeVariants };

