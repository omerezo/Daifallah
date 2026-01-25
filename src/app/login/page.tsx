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
import { useData } from '@/context/data-provider';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { login } = useData();
  const { toast } = useToast();
  const [email, setEmail] = useState('admin@umma.tech');
  const [password, setPassword] = useState('password');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = login(email, password);
    if (user) {
      router.push('/dashboard');
    } else {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('invalid_credentials'),
      });
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
                type="email"
                placeholder="name@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              />
            </div>
            <Button type="submit" className="w-full">
              {t('login')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
