'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // In a real app, you'd check auth status here.
    // For this scaffold, we'll always start at the login page.
    router.replace('/login');
  }, [router]);

  // Return null or a loading spinner while the redirect happens
  return null;
}
