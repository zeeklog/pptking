import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 导入翻译文件
import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';

const resources = {
  'zh-CN': {
    translation: zhCN
  },
  'en-US': {
    translation: enUS
  }
};

// 检查是否在浏览器环境中
const isBrowser = typeof window !== 'undefined';

const i18nConfig = {
  resources,
  fallbackLng: 'zh-CN',
  lng: 'zh-CN', // 默认语言，避免 SSR 时的检测问题
  debug: process.env.NODE_ENV === 'development',
  
  interpolation: {
    escapeValue: false, // React已经安全地转义了
  },
  
  // 只在浏览器环境中启用语言检测
  ...(isBrowser && {
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      lookupSessionStorage: 'i18nextLng',
      lookupCookie: 'i18nextLng',
      lookupQuerystring: 'lng',
      lookupFromPathIndex: 0,
      lookupFromSubdomainIndex: 0,
      
      // 检测浏览器语言
      caches: ['localStorage'],
      excludeCacheFor: ['cimode'],
      
      // 语言映射
      convertDetectedLanguage: (lng: string) => {
        const languageMap: { [key: string]: string } = {
          'zh': 'zh-CN',
          'zh-CN': 'zh-CN',
          'zh-TW': 'zh-CN',
          'zh-HK': 'zh-CN',
          'en': 'en-US',
          'en-US': 'en-US',
          'en-GB': 'en-US',
          'en-CA': 'en-US',
          'en-AU': 'en-US'
        };
        return languageMap[lng] || 'zh-CN';
      }
    }
  })
};

// 初始化 i18n
if (isBrowser) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init(i18nConfig);
} else {
  // 服务端只使用基本配置
  i18n
    .use(initReactI18next)
    .init(i18nConfig);
}

export default i18n;
