'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // 从localStorage加载主题设置
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme) {
        setTheme(savedTheme);
      }
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // 保存主题设置到localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
      
      // 应用主题
      const root = document.documentElement;
      
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        setResolvedTheme(systemTheme);
        root.classList.toggle('dark', systemTheme === 'dark');
      } else {
        setResolvedTheme(theme);
        root.classList.toggle('dark', theme === 'dark');
      }
    }
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    
    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        setResolvedTheme(e.matches ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, mounted]);

  // 防止水合错误：在客户端挂载前返回默认主题
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: 'system', setTheme, resolvedTheme: 'light' }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // 在服务端渲染时返回默认值
    if (typeof window === 'undefined') {
      return {
        theme: 'light' as Theme,
        setTheme: () => {},
        resolvedTheme: 'light' as 'light' | 'dark',
      };
    }
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
