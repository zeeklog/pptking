'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Z_INDEX } from '../constants/z-index';
import { 
  Layout,
  Search,
  Star,
  Plus,
  Eye,
  Download
} from 'lucide-react';
import { usePPTStore } from '../store/ppt-store';
import { TEMPLATE_CATEGORIES } from '../data/templates';
import { cn } from '@/lib/utils';

interface TemplateSelectorProps {
  onSelect?: (template: any) => void;
  onTemplateSelect?: () => void;
  trigger?: React.ReactNode;
}

export function TemplateSelector({ onSelect, onTemplateSelect, trigger }: TemplateSelectorProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isOpen, setIsOpen] = useState(false);
  
  const { availableTemplates, applyTemplate } = usePPTStore();

  // 过滤模板
  const filteredTemplates = availableTemplates.filter(template => {
    const matchesSearch = searchQuery === '' || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleTemplateSelect = (template: any) => {
    applyTemplate(template);
    if (onSelect) {
      onSelect(template);
    }
    if (onTemplateSelect) {
      onTemplateSelect();
    }
    setIsOpen(false);
  };

  const defaultTrigger = (
    <Button variant="outline" className="h-8">
      <Layout className="w-4 h-4 mr-2" />
      选择模板
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col" style={{ zIndex: Z_INDEX.DIALOG }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layout className="w-5 h-5" />
            选择模板
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* 搜索和筛选 */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
                placeholder="搜索模板..."
              />
            </div>
          </div>

          {/* 分类标签 */}
          <div className="flex gap-2 flex-wrap">
            {TEMPLATE_CATEGORIES.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-8",
                  selectedCategory === category.id && "bg-purple-500 text-white hover:bg-purple-600"
                )}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
                {category.count > 0 && (
                  <Badge variant="secondary" className="ml-2 h-4 text-xs">
                    {category.count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          {/* 模板网格 */}
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="group cursor-pointer border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200 hover:shadow-lg"
                  onClick={() => handleTemplateSelect(template)}
                >
                  {/* 模板预览 */}
                  <div className="aspect-[16/9] bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                    {template.thumbnail ? (
                      <img
                        src={template.thumbnail}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center"
                        style={{ 
                          background: `linear-gradient(135deg, ${template.theme.colors.primary} 0%, ${template.theme.colors.secondary} 100%)` 
                        }}
                      >
                        <Layout className="w-8 h-8 text-white opacity-60" />
                      </div>
                    )}
                    
                    {/* 悬停操作 */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          // 预览模板 - 在新窗口中打开预览
                          const previewWindow = window.open('', '_blank', 'width=800,height=600');
                          if (previewWindow) {
                            previewWindow.document.write(`
                              <html>
                                <head>
                                  <title>模板预览 - ${template.name}</title>
                                  <style>
                                    body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                                    .slide { width: 760px; height: 427px; border: 1px solid #ccc; margin: 20px 0; position: relative; }
                                    .slide-title { position: absolute; top: 10px; left: 10px; font-size: 14px; font-weight: bold; }
                                  </style>
                                </head>
                                <body>
                                  <h1>模板预览：${template.name}</h1>
                                  <p>类别：${template.category}</p>
                                  ${template.slides.map((slide, index) => `
                                    <div class="slide" style="background-color: ${slide.background?.value || '#FFFFFF'}">
                                      <div class="slide-title">幻灯片 ${index + 1}</div>
                                      <!-- 这里可以添加更详细的元素预览 -->
                                    </div>
                                  `).join('')}
                                </body>
                              </html>
                            `);
                            previewWindow.document.close();
                          }
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        className="h-8 bg-purple-500 hover:bg-purple-600"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTemplateSelect(template);
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* 模板信息 */}
                  <div className="p-3">
                    <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                      {template.name}
                    </h4>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {template.slides.length} 页
                      </span>
                      
                      <div className="flex gap-1">
                        {template.tags.slice(0, 2).map((tag) => (
                          <Badge 
                            key={tag} 
                            variant="secondary" 
                            className="text-xs h-4"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* 主题色彩预览 */}
                    <div className="flex gap-1 mt-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: template.theme.colors.primary }}
                      />
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: template.theme.colors.secondary }}
                      />
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: template.theme.colors.accent }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredTemplates.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                  <Layout className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>没有找到匹配的模板</p>
                  <p className="text-sm mt-1">尝试调整搜索条件或分类筛选</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* 底部操作 */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              共 {filteredTemplates.length} 个模板
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                取消
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // TODO: 创建空白演示文稿
                  console.log('Create blank presentation');
                  setIsOpen(false);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                空白演示文稿
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}