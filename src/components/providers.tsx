'use client';

import { ThemeProvider } from '@/context/theme-provider';
import { I18nProvider } from '@/context/i18n-provider';
import { DataProvider } from '@/context/data-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <DataProvider>{children}</DataProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
