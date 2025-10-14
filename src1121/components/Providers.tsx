// src/app/Providers.tsx
'use client';

import { StoreProvider } from '@/lib/redux/StoreProvider';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';
import { SocketProvider } from '@/hooks/useSocket';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <StoreProvider>
        <SocketProvider>
          {children}
          <Toaster />
        </SocketProvider>
      </StoreProvider>
    </ThemeProvider>
  );
}
