'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 dark:focus:ring-neutral-300',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-neutral-900 text-neutral-50 dark:bg-neutral-50 dark:text-neutral-900',
        secondary:
          'border-transparent bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50',
        destructive:
          'border-transparent bg-red-500 text-neutral-50 dark:bg-red-600',
        outline: 'text-neutral-950 dark:text-neutral-50',
        success:
          'border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
        warning:
          'border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
        error:
          'border-transparent bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
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

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

