'use client';

import { useEffect, useState } from 'react';
import i18n from '@/lib/i18n-safe';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 在客户端挂载后，从 localStorage 恢复语言设置
    const savedLanguage = localStorage.getItem('i18nextLng');
    console.log('I18nProvider: 从 localStorage 读取的语言设置:', savedLanguage);
    
    if (savedLanguage && (savedLanguage === 'zh-CN' || savedLanguage === 'en-US')) {
      console.log('I18nProvider: 设置语言为:', savedLanguage);
      i18n.changeLanguage(savedLanguage);
    } else {
      console.log('I18nProvider: 使用默认语言: zh-CN');
      // 确保设置默认语言并保存到 localStorage
      i18n.changeLanguage('zh-CN');
      localStorage.setItem('i18nextLng', 'zh-CN');
    }
    
    setMounted(true);
  }, []);

  // 防止水合错误：在客户端挂载前不渲染子组件
  if (!mounted) {
    return (
      <div className="min-h-screen bg-purple-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse text-purple-600">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
