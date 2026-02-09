'use client';

import * as React from 'react';
import { ToastContextProvider } from '@/hooks/useToast';
import { ConnectionProvider } from '@/hooks/useConnection';
import { Toaster } from '@/components/ui/Toaster';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ToastContextProvider>
      <ConnectionProvider>
        {children}
        <Toaster />
      </ConnectionProvider>
    </ToastContextProvider>
  );
}

