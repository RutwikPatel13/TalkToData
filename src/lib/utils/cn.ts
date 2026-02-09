import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes with clsx
 * Follows Sigma's utility pattern for className composition
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

