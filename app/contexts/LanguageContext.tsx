'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n-safe';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (language: string) => void;
  isChinese: boolean;
  isEnglish: boolean;
  t: (key: string, options?: any) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  useEffect(() => {
    setCurrentLanguage(i18n.language);
  }, [i18n.language]);

  const changeLanguage = async (language: string) => {
    console.log('LanguageContext: 切换语言到:', language);
    
    try {
      // 先保存到 localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('i18nextLng', language);
        console.log('LanguageContext: 语言已保存到 localStorage:', language);
      }
      
      // 然后更改 i18n 语言
      await i18n.changeLanguage(language);
      setCurrentLanguage(language);
      
      console.log('LanguageContext: 语言切换完成:', language);
    } catch (error) {
      console.error('LanguageContext: 语言切换失败:', error);
    }
  };

  const isChinese = currentLanguage === 'zh-CN';
  const isEnglish = currentLanguage === 'en-US';

  const value = {
    currentLanguage,
    changeLanguage,
    isChinese,
    isEnglish,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguageContext() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    // 在服务端渲染时返回默认值
    if (typeof window === 'undefined') {
      return {
        currentLanguage: 'zh-CN',
        changeLanguage: async () => {},
        isChinese: true,
        isEnglish: false,
        t: (key: string) => key, // 返回 key 作为默认值
      };
    }
    throw new Error('useLanguageContext must be used within a LanguageProvider');
  }
  return context;
}
