import { useTranslation } from 'react-i18next';
import { useLanguageContext } from '@/contexts/LanguageContext';

export function useLanguage() {
  // 优先使用 LanguageContext，如果不可用则回退到 useTranslation
  try {
    return useLanguageContext();
  } catch (error) {
    // 如果不在 LanguageProvider 中，回退到基本的 useTranslation
    const { i18n, t } = useTranslation();

    const changeLanguage = async (language: string) => {
      // 先保存到 localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('i18nextLng', language);
      }
      await i18n.changeLanguage(language);
    };

    const currentLanguage = i18n.language;
    const isChinese = currentLanguage === 'zh-CN';
    const isEnglish = currentLanguage === 'en-US';

    return {
      t,
      changeLanguage,
      currentLanguage,
      isChinese,
      isEnglish,
      i18n
    };
  }
}
