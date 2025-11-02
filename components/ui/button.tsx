import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] active:translate-y-[1px]',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg hover:from-orange-600 hover:to-orange-700 hover:shadow-xl hover-lift transition-all duration-300',
        destructive: 'bg-red-500 text-white hover:bg-red-600 shadow-lg hover-lift transition-all duration-300',
        outline:
          'bg-stone-50 text-orange-600 shadow-lg hover:bg-stone-100 hover:text-orange-700 hover:shadow-xl hover-lift transition-all duration-300',
        secondary: 'bg-orange-100 text-orange-700 hover:bg-orange-200 shadow-md hover-lift transition-all duration-300',
        ghost: 'hover:bg-orange-50 hover:text-orange-700 text-gray-700 transition-all duration-300',
        link: 'text-orange-600 underline-offset-4 hover:text-orange-700 hover:underline transition-all duration-300',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };



