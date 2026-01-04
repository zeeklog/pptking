'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Menu,
  FileText,
  Image,
  Shapes,
  BarChart3,
  Table,
  Palette,
  Settings,
  Layers,
  Play
} from 'lucide-react';
import { usePPTStore } from '../store/ppt-store';
import { ElementStylePanel } from './panels/ElementStylePanel';
import { ElementPositionPanel } from './panels/ElementPositionPanel';
import { SlideDesignPanel } from './panels/SlideDesignPanel';
import { cn } from '@/lib/utils';

export function MobileToolbar() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  
  const {
    selectedTool,
    setSelectedTool,
    activeElementIds,
  } = usePPTStore();

  const hasSelection = activeElementIds.length > 0;

  const tools = [
    { id: 'select', icon: Settings, label: '选择' },
    { id: 'text', icon: FileText, label: '文本' },
    { id: 'image', icon: Image, label: '图片' },
    { id: 'shape', icon: Shapes, label: '形状' },
    { id: 'chart', icon: BarChart3, label: '图表' },
    { id: 'table', icon: Table, label: '表格' },
  ];

  return (
    <>
      {/* 底部工具栏 */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-2 z-50">
        <div className="flex items-center justify-between">
          {/* 工具按钮 */}
          <div className="flex gap-1">
            {tools.slice(0, 4).map((tool) => {
              const Icon = tool.icon;
              return (
                <Button
                  key={tool.id}
                  variant={selectedTool === tool.id ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-10 w-10 p-0",
                    selectedTool === tool.id && "bg-purple-500 text-white"
                  )}
                  onClick={() => setSelectedTool(tool.id as any)}
                >
                  <Icon className="w-4 h-4" />
                </Button>
              );
            })}
          </div>

          {/* 更多工具和设置 */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0"
              onClick={() => {}}
            >
              <Play className="w-4 h-4" />
            </Button>
            
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh]">
                <SheetHeader>
                  <SheetTitle>编辑工具</SheetTitle>
                </SheetHeader>
                
                <div className="mt-4 h-full">
                  <Tabs defaultValue="tools" className="h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="tools">工具</TabsTrigger>
                      <TabsTrigger value="style" disabled={!hasSelection}>样式</TabsTrigger>
                      <TabsTrigger value="position" disabled={!hasSelection}>位置</TabsTrigger>
                      <TabsTrigger value="design">设计</TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-hidden mt-4">
                      <TabsContent value="tools" className="h-full">
                        <div className="grid grid-cols-3 gap-3">
                          {tools.map((tool) => {
                            const Icon = tool.icon;
                            return (
                              <Button
                                key={tool.id}
                                variant={selectedTool === tool.id ? "default" : "outline"}
                                className={cn(
                                  "h-20 flex flex-col items-center justify-center",
                                  selectedTool === tool.id && "bg-purple-500 text-white"
                                )}
                                onClick={() => {
                                  setSelectedTool(tool.id as any);
                                  setIsOpen(false);
                                }}
                              >
                                <Icon className="w-6 h-6 mb-1" />
                                <span className="text-xs">{tool.label}</span>
                              </Button>
                            );
                          })}
                        </div>
                      </TabsContent>

                      <TabsContent value="style" className="h-full overflow-auto">
                        <ElementStylePanel />
                      </TabsContent>

                      <TabsContent value="position" className="h-full overflow-auto">
                        <ElementPositionPanel />
                      </TabsContent>

                      <TabsContent value="design" className="h-full overflow-auto">
                        <SlideDesignPanel />
                      </TabsContent>
                    </div>
                  </Tabs>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      
      {/* 为底部工具栏预留空间 */}
      <div className="md:hidden h-16" />
    </>
  );
}