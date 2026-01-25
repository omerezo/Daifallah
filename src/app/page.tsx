'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/context/data-provider';

export default function RootPage() {
  const router = useRouter();
  const { currentUser } = useData();

  useEffect(() => {
    // In a real app, you'd check auth status here.
    if (currentUser) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [currentUser, router]);

  // Return null or a loading spinner while the redirect happens
  return null;
}
