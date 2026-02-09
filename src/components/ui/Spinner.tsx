'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-3',
};

export function Spinner({ className, size = 'md', ...props }: SpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-neutral-200 border-t-neutral-900 dark:border-neutral-800 dark:border-t-neutral-100',
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
}

