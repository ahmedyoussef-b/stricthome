// src/lib/redux/StoreProvider.tsx
'use client'

import { Provider } from 'react-redux'
import { useAuthInitializer } from '@/hooks/useAuthInitializer' // Import the new custom hook
import { store } from '@/lib/redux/store';
import type { ReactNode } from 'react';

function AuthManager({ children }: { children: ReactNode }) {
    // This custom hook now contains the logic to fetch the session only once
    // and manage the global loading state.
    console.log("⚛️ [StoreProvider] AuthManager is rendering. Calling useAuthInitializer.");
    useAuthInitializer();
    
    // Render children immediately; loading states are handled by individual pages.
    return <>{children}</>;
}


export function StoreProvider({
  children,
}: {
  children: ReactNode
}) {
  return (
    <Provider store={store}>
      <AuthManager>{children}</AuthManager>
    </Provider>
  )
}
