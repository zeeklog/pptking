// 安全的 i18n 配置，避免 SSR 问题
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 导入翻译文件
import zhCN from '@/i18n/locales/zh-CN.json';
import enUS from '@/i18n/locales/en-US.json';

const resources = {
  'zh-CN': {
    translation: zhCN
  },
  'en-US': {
    translation: enUS
  }
};

// 确保 i18n 只初始化一次
if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: 'zh-CN', // 默认语言
      fallbackLng: 'zh-CN',
      debug: false, // 禁用调试避免控制台错误
      
      interpolation: {
        escapeValue: false,
      },
      
      // 禁用自动语言检测，完全依赖手动设置
      // detection: {
      //   order: ['localStorage'],
      //   lookupLocalStorage: 'i18nextLng',
      //   caches: ['localStorage'],
      //   excludeCacheFor: ['cimode'],
      // },
      
      // React 特定配置
      react: {
        useSuspense: false, // 禁用 Suspense 避免 SSR 问题
      },
    });
}

export default i18n;
