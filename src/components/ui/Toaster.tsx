'use client';

import { useToast } from '@/hooks/useToast';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from './Toast';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  default: Info,
};

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, type }) => {
        const Icon = icons[type] || icons.default;
        const variant = type === 'error' ? 'destructive' : type === 'success' ? 'success' : 'default';
        
        return (
          <Toast key={id} variant={variant}>
            <div className="flex gap-3">
              <Icon className="h-5 w-5 shrink-0" />
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
            </div>
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}

