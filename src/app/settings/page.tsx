
'use client';

import React from 'react';
import { useTranslation } from '@/hooks/use-translation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/context/theme-provider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useData } from '@/context/data-provider';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { t, setLanguage, lang } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { setLogo } = useData();
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === "image/png" || file.type === "image/jpeg" || file.type === "image/webp")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          setLogo(result);
        }
      };
      reader.readAsDataURL(file);
    } else if (file) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('invalid_file_type'),
      });
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
        {t('settings')}
      </h1>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('display')}</CardTitle>
            <CardDescription>
              {t('customize_appearance_language')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode" className="flex flex-col gap-1">
                <span>{t('dark_mode')}</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  {t('toggle_dark_mode')}
                </span>
              </Label>
              <Switch
                id="dark-mode"
                checked={theme === 'dark'}
                onCheckedChange={(checked) =>
                  setTheme(checked ? 'dark' : 'light')
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="language" className="flex flex-col gap-1">
                <span>{t('language')}</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  {t('select_app_language')}
                </span>
              </Label>
              <RadioGroup
                defaultValue={lang}
                onValueChange={(value) => setLanguage(value as 'en' | 'ar')}
                className="flex items-center gap-4"
              >
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <RadioGroupItem value="en" id="lang-en" />
                  <Label htmlFor="lang-en">English</Label>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <RadioGroupItem value="ar" id="lang-ar" />
                  <Label htmlFor="lang-ar">العربية</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('branding')}</CardTitle>
            <CardDescription>{t('customize_logo_branding')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="logo-upload" className="flex flex-col gap-1">
                <span>{t('committee_logo')}</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  {t('upload_new_logo')}
                </span>
              </Label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoUpload}
                accept="image/png, image/jpeg, image/webp"
                className="sr-only"
                id="logo-upload-input"
              />
              <Button variant="outline" onClick={handleUploadClick}>
                <Upload className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                {t('upload')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
