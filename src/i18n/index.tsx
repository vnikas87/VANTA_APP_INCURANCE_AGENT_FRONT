import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { translations, type AppLanguage } from './translations';

const GLOBAL_LANG_KEY = 'app_lang';
const USER_LANG_PREFIX = 'app_lang_user_';

function getStoredLang(): AppLanguage {
  const value = localStorage.getItem(GLOBAL_LANG_KEY);
  return value === 'el' ? 'el' : 'en';
}

export function getStoredUserLang(userId?: number | string): AppLanguage | null {
  if (!userId) return null;
  const value = localStorage.getItem(`${USER_LANG_PREFIX}${userId}`);
  if (value === 'en' || value === 'el') return value;
  return null;
}

type I18nContextValue = {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage, userId?: number | string) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(() => getStoredLang());

  const setLanguage = (lang: AppLanguage, userId?: number | string) => {
    setLanguageState(lang);
    localStorage.setItem(GLOBAL_LANG_KEY, lang);
    if (userId) {
      localStorage.setItem(`${USER_LANG_PREFIX}${userId}`, lang);
    }
  };

  const value = useMemo<I18nContextValue>(() => {
    return {
      language,
      setLanguage,
      t: (key: string) => translations[language][key] ?? key,
    };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}

export function tStatic(key: string): string {
  const lang = getStoredLang();
  return translations[lang][key] ?? key;
}
