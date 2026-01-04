'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Palette, 
  Move, 
  Zap, 
  Layout,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { usePPTStore } from '../store/ppt-store';
import { ElementStylePanel } from './panels/ElementStylePanel';
import { ElementPositionPanel } from './panels/ElementPositionPanel';
import { ElementAnimationPanel } from './panels/ElementAnimationPanel';
import { SlideDesignPanel } from './panels/SlideDesignPanel';
import { SlideAnimationPanel } from './panels/SlideAnimationPanel';
import { MultiSelectionPanel } from './panels/MultiSelectionPanel';
import { cn } from '@/lib/utils';

export function Toolbar() {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  
  const {
    toolbarWidth,
    showToolbar,
    toolbarActivePanel,
    activeElementIds,
    setToolbarActivePanel,
    toggleToolbar,
  } = usePPTStore();

  const hasSelection = activeElementIds.length > 0;
  const hasMultiSelection = activeElementIds.length > 1;

  if (!showToolbar) {
    return (
      <div 
        className="w-8 border-l flex flex-col bg-white dark:bg-gray-900 border-purple-200 dark:border-purple-700"
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 m-1"
          onClick={toggleToolbar}
          title="显示工具栏"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  const panels = [
    {
      id: 'style' as const,
      title: '样式',
      icon: <Palette className="w-4 h-4" />,
      component: <ElementStylePanel />,
      available: hasSelection,
    },
    {
      id: 'position' as const,
      title: '位置',
      icon: <Move className="w-4 h-4" />,
      component: <ElementPositionPanel />,
      available: hasSelection,
    },
    {
      id: 'animation' as const,
      title: '动画',
      icon: <Zap className="w-4 h-4" />,
      component: <ElementAnimationPanel />,
      available: hasSelection,
    },
    {
      id: 'design' as const,
      title: '设计',
      icon: <Layout className="w-4 h-4" />,
      component: <SlideDesignPanel />,
      available: true,
    },
    {
      id: 'slide-animation' as const,
      title: '切换',
      icon: <Layers className="w-4 h-4" />,
      component: <SlideAnimationPanel />,
      available: true,
    },
  ];

  // 如果有多选，显示多选面板
  if (hasMultiSelection) {
    return (
      <div 
        className="border-l flex flex-col bg-white dark:bg-gray-900 border-purple-200 dark:border-purple-700"
        style={{ 
          width: collapsed ? 60 : toolbarWidth
        }}
      >
        {/* 头部 */}
        <div className="h-12 flex items-center justify-between px-3 border-b border-gray-200 dark:border-gray-700">
          {!collapsed && (
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              多选操作 ({activeElementIds.length})
            </h3>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>

        {/* 多选面板内容 */}
        {!collapsed && (
          <ScrollArea className="flex-1" style={{ maxHeight: 'calc(100vh - 16rem)' }}>
            <div className="p-3 pb-6">
              <MultiSelectionPanel />
            </div>
          </ScrollArea>
        )}
      </div>
    );
  }

  return (
    <div 
      className="border-l flex flex-col bg-white dark:bg-gray-900 border-purple-200 dark:border-purple-700"
      style={{ 
        width: collapsed ? 60 : toolbarWidth
      }}
    >
      {/* 头部 */}
      <div className="h-12 flex items-center justify-between px-3 border-b border-gray-200 dark:border-gray-700">
        {!collapsed && (
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">属性面板</h3>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>

      {/* 面板内容 */}
      {!collapsed && (
        <div className="flex-1 flex flex-col">
          <Tabs 
            value={toolbarActivePanel} 
            onValueChange={(value) => setToolbarActivePanel(value as any)}
            className="flex-1 flex flex-col"
          >
            {/* 标签页头部 */}
            <TabsList className="grid w-full grid-cols-5 h-12 p-1 bg-gray-50 dark:bg-gray-700/50">
              {panels.map((panel) => (
                <TabsTrigger
                  key={panel.id}
                  value={panel.id}
                  className={cn(
                    "flex flex-col items-center justify-center p-1 h-10",
                    !panel.available && "opacity-50 pointer-events-none"
                  )}
                  disabled={!panel.available}
                  title={panel.title}
                >
                  {panel.icon}
                  <span className="text-xs mt-1">{panel.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* 面板内容区域 */}
            <div className="flex-1 overflow-hidden">
              {panels.map((panel) => (
                <TabsContent
                  key={panel.id}
                  value={panel.id}
                  className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col"
                >
                  <ScrollArea className="flex-1" style={{ maxHeight: 'calc(100vh - 16rem)' }}>
                    <div className="p-3 pb-6">
                      {panel.component}
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>
      )}
    </div>
  );
}