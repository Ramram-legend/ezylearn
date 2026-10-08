'use client';

import React, { useState } from 'react';
import { AuthContext, useAuthState } from '@/hooks/useAuth';
import AuthModal from '@/components/AuthModal';

/**
 * Wraps the app with auth context and the global AuthModal.
 * Place inside RootLayout > body.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [modalOpen, setModalOpen] = useState(false);

  const authState = useAuthState(() => setModalOpen(true));

  return (
    <AuthContext.Provider value={authState}>
      {children}
      <AuthModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </AuthContext.Provider>
  );
}
