import React, { createContext, useContext, useState } from 'react';
import { translations } from '../utils/i18n';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('dv3_language') || 'ko';
  });

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('dv3_language', lang);
  };

  const t = (key) => {
    return translations[language]?.[key] || translations['ko']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
