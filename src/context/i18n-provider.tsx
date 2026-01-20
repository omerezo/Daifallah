'use client';

import {
  createContext,
  useState,
  useEffect,
  type ReactNode,
  useCallback,
} from 'react';
import en from '@/locales/en.json';
import ar from '@/locales/ar.json';

type Language = 'en' | 'ar';
type Direction = 'ltr' | 'rtl';

interface I18nContextType {
  lang: Language;
  dir: Direction;
  t: (key: string,
    options?: { [key: string]: string | number }
  ) => string;
  setLanguage: (lang: Language) => void;
}

export const I18nContext = createContext<I18nContextType | undefined>(
  undefined
);

const translations: Record<Language, { [key: string]: string }> = { en, ar };

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    const storedLang = localStorage.getItem('lang') as Language | null;
    if (storedLang && ['en', 'ar'].includes(storedLang)) {
      setLang(storedLang);
    }
  }, []);

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    localStorage.setItem('lang', lang);
  }, [lang, dir]);

  const t = useCallback((key: string, options?: { [key: string]: string | number }) => {
    let translation = translations[lang][key] || translations['en'][key] || key;
    if (options) {
      Object.keys(options).forEach((k) => {
        translation = translation.replace(`{{${k}}}`, String(options[k]));
      });
    }
    return translation;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, dir, t, setLanguage: setLang }}>
      {children}
    </I18nContext.Provider>
  );
}
