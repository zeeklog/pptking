'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { LoginModal } from '@/components/LoginModal';

interface LoginModalContextType {
  showLoginModal: (onSuccess?: () => void) => void;
  hideLoginModal: () => void;
  isLoginModalOpen: boolean;
}

const LoginModalContext = createContext<LoginModalContextType | undefined>(undefined);

export function LoginModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [onSuccessCallback, setOnSuccessCallback] = useState<(() => void) | undefined>(undefined);

  const showLoginModal = useCallback((onSuccess?: () => void) => {
    setOnSuccessCallback(() => onSuccess);
    setIsOpen(true);
  }, []);

  const hideLoginModal = useCallback(() => {
    setIsOpen(false);
    setOnSuccessCallback(undefined);
  }, []);

  const handleSuccess = useCallback(() => {
    if (onSuccessCallback) {
      onSuccessCallback();
    }
    hideLoginModal();
  }, [onSuccessCallback, hideLoginModal]);

  return (
    <LoginModalContext.Provider
      value={{
        showLoginModal,
        hideLoginModal,
        isLoginModalOpen: isOpen,
      }}
    >
      {children}
      <LoginModal
        isOpen={isOpen}
        onClose={hideLoginModal}
        onSuccess={handleSuccess}
      />
    </LoginModalContext.Provider>
  );
}

export function useLoginModal() {
  const context = useContext(LoginModalContext);
  if (context === undefined) {
    // 在服务端渲染或未提供 Provider 时返回默认值
    if (typeof window === 'undefined') {
      return {
        showLoginModal: () => {},
        hideLoginModal: () => {},
        isLoginModalOpen: false,
      };
    }
    throw new Error('useLoginModal must be used within a LoginModalProvider');
  }
  return context;
}
