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
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [email, setEmail] = useState('first.admin@umma.tech');
  const [password, setPassword] = useState('ChangeMeLater!2024');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // After successful login, check if the user profile exists in Firestore.
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // If the profile doesn't exist, create it. This handles cases where
        // the auth user was created but the firestore doc creation failed previously.
        // We'll be charitable and create it here, assuming they are the default admin.
        if (email === 'first.admin@umma.tech') {
            await setDoc(userDocRef, { id: user.uid, name: 'Founding Admin', email, role: 'Admin' });
            toast({
                title: "Admin Profile Restored",
                description: "Your admin profile was missing and has been restored. Logging you in.",
            });
        }
      }

      router.push('/dashboard');
    } catch (error: any) {
      // If user is not found, this is likely the first login. Create an admin user.
      if (error.code === 'auth/user-not-found') {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const newUserId = userCredential.user.uid;
          
          const userDocRef = doc(firestore, 'users', newUserId);
          // Make sure this completes before we redirect.
          await setDoc(userDocRef, { id: newUserId, name: 'Founding Admin', email, role: 'Admin' });
          
          toast({
            title: "Admin User Created",
            description: "The default admin user has been created. You are now being logged in.",
          });
          
          router.push('/dashboard');

        } catch (creationError: any) {
          console.error("Admin user creation failed:", creationError);
          // This can happen if the user exists but the password was wrong in the first try.
          if (creationError.code === 'auth/email-already-in-use') {
             toast({
                variant: 'destructive',
                title: t('error'),
                description: "This email is already registered, but the password was incorrect. Please try again or use 'Forgot Password'.",
             });
          } else {
            toast({
              variant: 'destructive',
              title: 'Error during setup',
              description: creationError.message,
            });
          }
        }
      } else {
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
