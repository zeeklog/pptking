'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EditorHeader } from './components/EditorHeader';
import { Thumbnails } from './components/Thumbnails';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { Remark } from './components/Remark';
import { MobileToolbar } from './components/MobileToolbar';
import { WelcomeDialog } from './components/WelcomeDialog';
import { ExportProgress } from './components/ExportProgress';
import { StatusBar } from './components/StatusBar';
import { QuickActions } from './components/QuickActions';
import { usePPTStore } from './store/ppt-store';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export function PPTEditClient() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  const { initializeStore, slides } = usePPTStore();
  const isMobile = useIsMobile();

  // 启用快捷键
  useKeyboardShortcuts();

  useEffect(() => {
    // 初始化PPT编辑器
    const init = async () => {
      try {
        await initializeStore();
        setIsLoading(false);
      } catch (error) {
        console.error('PPT编辑器初始化失败:', error);
        setIsLoading(false);
      }
    };

    init();
  }, [initializeStore]);

  // 单独处理欢迎对话框的显示逻辑
  useEffect(() => {
    if (!isLoading && !hasShownWelcome) {
      // 检查是否已经关闭过欢迎对话框（使用sessionStorage记录）
      const welcomeAlreadyShown = sessionStorage.getItem('ppt-editor-welcome-shown');
      
      if (!welcomeAlreadyShown) {
        const hasContent = slides.length > 1 || (slides[0]?.elements.length > 0);
        if (!hasContent) {
          setShowWelcome(true);
          setHasShownWelcome(true);
        }
      }
    }
  }, [isLoading, slides, hasShownWelcome]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: '#EEF2FF' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium" style={{ color: '#4F46E5' }}>
              PPT KING 编辑器
            </h3>
            <p className="text-sm" style={{ color: '#6B7280' }}>
              正在初始化编辑器...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ backgroundColor: '#EEF2FF' }}>
      {/* 编辑器头部 - 桌面端显示 */}
      {!isMobile && <EditorHeader />}
      
      {/* 快速操作栏 - 桌面端显示 */}
      {!isMobile && <QuickActions />}
      
      {/* 主编辑区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧缩略图面板 - 桌面端显示 */}
        {!isMobile && <Thumbnails />}
        
        {/* 中央画布区域 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Canvas />
          {/* 底部备注区域 - 桌面端显示 */}
          {!isMobile && <Remark />}
        </div>
        
        {/* 右侧工具栏 - 桌面端显示 */}
        {!isMobile && <Toolbar />}
      </div>
      
      {/* 移动端工具栏 */}
      {isMobile && <MobileToolbar />}
      
      {/* 状态栏 - 桌面端显示 */}
      {!isMobile && <StatusBar />}
      
      {/* 欢迎对话框 */}
      <WelcomeDialog 
        isOpen={showWelcome}
        onClose={() => {
          setShowWelcome(false);
          // 记录用户已经关闭过欢迎对话框
          sessionStorage.setItem('ppt-editor-welcome-shown', 'true');
        }}
      />
      
      {/* 导出进度对话框 */}
      <ExportProgress />
    </div>
  );
}