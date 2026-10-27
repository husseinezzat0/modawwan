import { api } from '../db/apiClient';
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Language, TranslationDictionary, translations } from './translations';

interface LanguageContextType {
  language: Language;
  dir: 'rtl' | 'ltr';
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof TranslationDictionary) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'modawwan_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const applyLanguage = (lang: Language) => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.body.dir = document.documentElement.dir;
    setLanguageState(lang);
  };
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'ar' || saved === 'en') return saved;
    } catch {}
    return 'ar';
  });

  const changed = useRef(false);
  const pendingSave = useRef<Promise<unknown>>(Promise.resolve());
  useEffect(() => { api.getSetting('language', null).then(saved => { if (!changed.current && (saved === 'ar' || saved === 'en')) applyLanguage(saved); }).catch(console.error); }, []);

  const dir: 'rtl' | 'ltr' = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {}
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
    document.body.dir = dir;
  }, [language, dir]);

  const setLanguage = (lang: Language) => {
    changed.current = true;
    applyLanguage(lang);
    pendingSave.current = pendingSave.current.then(() => api.setSetting('language', lang)).catch(console.error);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const t = (key: keyof TranslationDictionary): string => {
    return translations[language][key] || translations['ar'][key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, dir, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
