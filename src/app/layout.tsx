'use client';

import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import { usePathname } from 'next/navigation';
import AppLayout from './AppLayout';
import { FirebaseClientProvider } from '@/firebase';
import { DataProvider } from '@/context/data-provider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <title>جمعية ابناء ضيف الله الخيرية</title>
        <meta
          name="description"
          content="تطبيق إدارة جمعية خيرية عائلية"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&family=Inter:wght@400;500;600&family=Outfit:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <FirebaseClientProvider>
          <DataProvider>
            <Providers>
              {isLoginPage ? children : <AppLayout>{children}</AppLayout>}
              <Toaster />
            </Providers>
          </DataProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
