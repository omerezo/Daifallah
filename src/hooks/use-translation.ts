'use client';

import { useContext } from 'react';
import { I18nContext } from '@/context/i18n-provider';

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};
