import { redirect } from 'next/navigation';

export default function RootPage() {
  // In a real app, you'd check auth status here from a cookie or server session.
  // If authenticated, redirect('/dashboard').
  // For this scaffold, we'll always start at the login page.
  redirect('/login');
}
