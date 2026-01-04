"use client";

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = (event: any) => {
      setIsFullscreen(event.detail?.isFullscreen || false);
    };

    const handleBrowserFullscreenChange = () => {
      // 同步浏览器的全屏状态
      setIsFullscreen(!!document.fullscreenElement);
    };

    // 监听自定义全屏事件
    window.addEventListener('fullscreenChange', handleFullscreenChange);
    // 监听浏览器原生全屏事件
    document.addEventListener('fullscreenchange', handleBrowserFullscreenChange);

    return () => {
      window.removeEventListener('fullscreenChange', handleFullscreenChange);
      document.removeEventListener('fullscreenchange', handleBrowserFullscreenChange);
    };
  }, []);

  // 对于 /chat 路径，不显示 Header 和 Footer
  const isChatPage = pathname === '/chat' || pathname?.startsWith('/chat/');

  // 对于 /ppt-edit 路径，使用全屏布局，不显示 Footer
  const isPPTEditPage = pathname === '/ppt-edit' || pathname?.startsWith('/ppt-edit/');

  // 对于 /generate 路径，不显示 Footer
  const isGeneratePage = pathname === '/generate' || pathname?.startsWith('/generate/');

  // 对于聊天页面，不显示 Header 和 Footer
  if (isChatPage) {
    return (
      <div className="min-h-screen bg-purple-50 dark:bg-gray-900">
      <Header/>
        {children}
      </div>
    );
  }

  // 对于 PPT 编辑页面，展示 Header，不显示 Footer，使用 flex 布局避免滚动
  if (isPPTEditPage) {
    return (
      <div className="h-screen flex flex-col bg-purple-50 dark:bg-gray-900">
        {!isFullscreen && <Header/>}
        <main className={`flex-1 overflow-hidden ${!isFullscreen ? 'pt-16' : ''}`}>
          {children}
        </main>
      </div>
    );
  }

  // 对于 generate 页面，展示 Header，不显示 Footer
  if (isGeneratePage) {
    return (
      <div className="min-h-screen relative">
        <Header />
        <main className="mxn-h-screen overflow-hidden h-[calc(100vh - 64px)]"> 
          {children}
        </main>

        {/* 居中的页脚版权声明 */}
        <div className="absolute bottom-6 left-0 right-0 text-center text-tech-500 text-sm">
            <span className="mr-2">Copyright © {new Date().getFullYear()} {location.hostname}</span>
            <span>All Rights Reserved</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-50 dark:bg-gray-900">
      <Header/>
      <main className="pt-14 sm:pt-16">
        {children}
      </main>
      <Footer />
    </div>
  );
}
