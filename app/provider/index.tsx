'use client';

import { ReduxProviders } from '@/store/provider';
import { useInitialRender } from '@/hooks';
import { ReloadProvider } from '@/hooks/useReloadContext';
import { Toaster } from '@/components/ui/sonner';
import UseQueryProvider from './UseQuery';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
  const isInitialRenderComplete = useInitialRender();

  if (!isInitialRenderComplete) return null;

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <UseQueryProvider>
        <ReloadProvider>
          <ReduxProviders>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </ReduxProviders>
        </ReloadProvider>
      </UseQueryProvider>
    </ThemeProvider>
  );
}
