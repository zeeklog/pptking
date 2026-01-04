'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Z_INDEX } from '../constants/z-index';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Palette,
  Check,
  Plus,
  Download,
  Upload
} from 'lucide-react';
import { usePPTStore } from '../store/ppt-store';
import { cn } from '@/lib/utils';

interface ThemeSelectorProps {
  trigger?: React.ReactNode;
}

export function ThemeSelector({ trigger }: ThemeSelectorProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  
  const { 
    currentTheme, 
    availableThemes, 
    applyTheme 
  } = usePPTStore();

  const handleThemeSelect = (theme: any) => {
    applyTheme(theme);
    setIsOpen(false);
  };

  const defaultTrigger = (
    <Button variant="outline" className="h-8">
      <Palette className="w-4 h-4 mr-2" />
      选择主题
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-3xl h-[70vh] flex flex-col" style={{ zIndex: Z_INDEX.DIALOG }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            选择主题
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* 当前主题 */}
          <Card className="border-purple-200 dark:border-purple-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  <div 
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: currentTheme.colors.primary }}
                  />
                  <div 
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: currentTheme.colors.secondary }}
                  />
                  <div 
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: currentTheme.colors.accent }}
                  />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    当前主题: {currentTheme.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {currentTheme.fonts.heading} | {currentTheme.colors.primary}
                  </p>
                </div>
                
                <Check className="w-5 h-5 text-green-500" />
              </div>
            </CardContent>
          </Card>

          {/* 主题列表 */}
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
              {availableThemes.map((theme) => {
                const isActive = theme.id === currentTheme.id;
                
                return (
                  <Card
                    key={theme.id}
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:shadow-lg",
                      isActive 
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20" 
                        : "border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600"
                    )}
                    onClick={() => handleThemeSelect(theme)}
                  >
                    <CardContent className="p-4">
                      {/* 主题预览 */}
                      <div className="space-y-3">
                        {/* 色彩预览 */}
                        <div className="flex justify-between items-center">
                          <div className="flex gap-2">
                            <div 
                              className="w-6 h-6 rounded"
                              style={{ backgroundColor: theme.colors.primary }}
                              title="主色"
                            />
                            <div 
                              className="w-6 h-6 rounded"
                              style={{ backgroundColor: theme.colors.secondary }}
                              title="辅色"
                            />
                            <div 
                              className="w-6 h-6 rounded"
                              style={{ backgroundColor: theme.colors.accent }}
                              title="强调色"
                            />
                            <div 
                              className="w-6 h-6 rounded border border-gray-300"
                              style={{ backgroundColor: theme.colors.background }}
                              title="背景色"
                            />
                          </div>
                          
                          {isActive && <Check className="w-5 h-5 text-green-500" />}
                        </div>

                        {/* 主题信息 */}
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                            {theme.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {theme.fonts.heading}
                          </p>
                        </div>

                        {/* 样式预览 */}
                        <div 
                          className="h-16 rounded p-2 text-xs"
                          style={{ 
                            backgroundColor: theme.colors.background,
                            color: theme.colors.text,
                          }}
                        >
                          <div 
                            className="font-medium mb-1"
                            style={{ color: theme.colors.primary }}
                          >
                            示例标题
                          </div>
                          <div>这是正文内容的预览效果</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>

          {/* 底部操作 */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              共 {availableThemes.length} 个主题
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // 导入主题
                  const fileInput = document.createElement('input');
                  fileInput.type = 'file';
                  fileInput.accept = '.json';
                  fileInput.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        try {
                          const content = e.target?.result as string;
                          const importedTheme = JSON.parse(content);
                          
                          // 验证主题格式
                          if (importedTheme.colors && importedTheme.fonts) {
                            applyTheme(importedTheme);
                            alert('主题导入成功！');
                          } else {
                            alert('主题格式不正确，请检查文件格式');
                          }
                        } catch (error) {
                          console.error('主题导入失败:', error);
                          alert('主题文件格式错误');
                        }
                      };
                      reader.readAsText(file);
                    }
                  };
                  fileInput.click();
                }}
              >
                <Upload className="w-4 h-4 mr-2" />
                导入主题
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // 创建自定义主题
                  const customTheme = {
                    id: `custom-${Date.now()}`,
                    name: '自定义主题',
                    colors: {
                      primary: '#6366F1',
                      secondary: '#8B5CF6',
                      accent: '#06B6D4',
                      background: '#FFFFFF',
                      text: '#374151',
                      border: '#E5E7EB',
                    },
                    fonts: {
                      heading: 'Inter, sans-serif',
                      body: 'Inter, sans-serif',
                    },
                    shadows: {
                      small: '0 1px 2px rgba(0, 0, 0, 0.05)',
                      medium: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      large: '0 10px 15px rgba(0, 0, 0, 0.1)',
                    },
                  };
                  
                  // 导出主题文件
                  const blob = new Blob([JSON.stringify(customTheme, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${customTheme.name}.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  
                  alert('自定义主题已导出，您可以编辑后重新导入');
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                自定义主题
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                关闭
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}