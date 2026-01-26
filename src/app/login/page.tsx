'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { useTranslation } from '@/hooks/use-translation';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useData } from '@/context/data-provider';

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const { addUser } = useData();
  const [email, setEmail] = useState('admin@umma.tech');
  const [password, setPassword] = useState('admin@123');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error: any) {
      // If user is not found, create a new admin user.
      if (error.code === 'auth/user-not-found' && email === 'admin@umma.tech') {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const newUserId = userCredential.user.uid;

          // Add user profile to Firestore
          addUser({ name: 'admin', email, role: 'Admin' }, newUserId);
          
          toast({
            title: "Admin User Created",
            description: "The default admin user has been created. You are now being logged in.",
          });
          
          // The onAuthStateChanged listener will redirect to dashboard, but we push to be safe.
          router.push('/dashboard');

        } catch (creationError: any) {
          console.error("Admin user creation failed:", creationError);
          toast({
            variant: 'destructive',
            title: t('error'),
            description: `Could not create admin user: ${creationError.message}`,
          });
        }
      } else {
        console.error("Login failed:", error);
        toast({
          variant: 'destructive',
          title: t('error'),
          description: t('invalid_credentials'),
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Logo className="h-16 w-16" />
          </div>
          <CardTitle className="font-display text-3xl">
            {t('app_name')}
          </CardTitle>
          <CardDescription>{t('login_description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="text"
                placeholder="name@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">{t('password')}</Label>
                <Link
                  href="#"
                  className="ltr:ml-auto rtl:mr-auto inline-block text-sm underline"
                >
                  {t('forgot_password')}
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '...' : t('login')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
