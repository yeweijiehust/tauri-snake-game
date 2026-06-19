import { createContext, useContext, useState, type ReactNode } from 'react';
import en from '../locales/en';
import zh from '../locales/zh';
import type { LocaleDict, LocaleKey } from '../locales/types';

type Locale = 'en' | 'zh';

const dicts: Record<Locale, LocaleDict> = { en, zh };

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: LocaleKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');

  const t = (key: LocaleKey): string => dicts[locale][key];

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
