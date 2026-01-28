'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/app/lib/stores/authStore';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider component that initializes authentication state on mount.
 * Wrap your app with this component to enable authentication.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const initialize = useAuthStore(state => state.initialize);
  const isInitialized = useAuthStore(state => state.isInitialized);

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

  return <>{children}</>;
}
