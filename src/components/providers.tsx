'use client';

import { ThemeProvider } from '@/context/theme-provider';
import { I18nProvider } from '@/context/i18n-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        {children}
      </I18nProvider>
    </ThemeProvider>
  );
}
