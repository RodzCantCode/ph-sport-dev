import * as React from 'react';

import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-lg glass-effect px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 dark:placeholder:text-gray-500 text-gray-800 dark:text-gray-200',
          // Focus: naranja más claro, visible y sin halo blanco
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/90 focus-visible:ring-offset-0 focus:border-orange-400/50',
          // Glow muy sutil cercano al color de los botones
          'transition-all duration-300 focus:shadow-[0_0_0_6px_rgba(251,146,60,0.14)] disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };


