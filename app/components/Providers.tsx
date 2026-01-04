'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { LoginModalProvider } from '@/contexts/LoginModalContext';
import { ThemeProvider } from '@/contexts/ThemeProvider';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { I18nProvider } from '@/components/I18nProvider';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <LoginModalProvider>
                {children}
              </LoginModalProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </I18nProvider>
  );
}
