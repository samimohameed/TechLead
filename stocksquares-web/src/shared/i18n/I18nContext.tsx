import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from './translations';

interface I18nContextValue {
  language: Language;
  direction: 'ltr' | 'rtl';
  t: typeof translations['en'];
  toggleLanguage: () => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('stocksquares_lang') as Language) || 'en';
  });

  const direction: 'ltr' | 'rtl' = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
    localStorage.setItem('stocksquares_lang', language);
  }, [language, direction]);

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'ar' : 'en'));
  };

  const value = {
    language,
    direction,
    t: translations[language],
    toggleLanguage
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};
