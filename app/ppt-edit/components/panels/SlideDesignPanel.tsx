'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Layout, 
  Palette, 
  Image as ImageIcon,
  Paintbrush,
  Upload,
  Trash2,
  Eye
} from 'lucide-react';
import { usePPTStore } from '../../store/ppt-store';

export function SlideDesignPanel() {
  const { t } = useTranslation();
  const [backgroundTab, setBackgroundTab] = useState('color');
  
  const {
    slides,
    activeSlideIndex,
    currentTheme,
    updateSlideBackground,
    updateSlideTitle,
  } = usePPTStore();

  const currentSlide = slides[activeSlideIndex];
  const background = currentSlide?.background;

  if (!currentSlide) return null;

  const handleBackgroundChange = (type: 'color' | 'image' | 'gradient', value: string) => {
    updateSlideBackground(activeSlideIndex, {
      type,
      value,
    });
  };

  const predefinedColors = [
    '#FFFFFF', '#F8FAFC', '#F1F5F9', '#E2E8F0',
    '#EEF2FF', '#E0E7FF', '#C7D2FE', '#A5B4FC',
    '#6366F1', '#4F46E5', '#4338CA', '#3730A3',
    '#1E293B', '#0F172A', '#000000', '#374151',
  ];

  const gradientPresets = [
    {
      name: '紫色科技',
      value: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
    },
    {
      name: '蓝色渐变',
      value: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    },
    {
      name: '绿色清新',
      value: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    },
    {
      name: '橙色活力',
      value: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    },
    {
      name: '粉色梦幻',
      value: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
    },
    {
      name: '灰色简约',
      value: 'linear-gradient(135deg, #6B7280 0%, #374151 100%)',
    },
  ];

  return (
    <div className="space-y-4">
      {/* 幻灯片信息 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layout className="w-4 h-4" />
            幻灯片 {activeSlideIndex + 1}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs text-gray-600 dark:text-gray-400">标题</Label>
            <Input
              value={currentSlide.title}
              onChange={(e) => {
                updateSlideTitle(activeSlideIndex, e.target.value);
              }}
              className="h-8"
              placeholder="幻灯片标题"
            />
          </div>
        </CardContent>
      </Card>

      {/* 背景设置 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Palette className="w-4 h-4" />
            背景设置
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={backgroundTab} onValueChange={setBackgroundTab}>
            <TabsList className="grid w-full grid-cols-3 h-8">
              <TabsTrigger value="color" className="text-xs">纯色</TabsTrigger>
              <TabsTrigger value="gradient" className="text-xs">渐变</TabsTrigger>
              <TabsTrigger value="image" className="text-xs">图片</TabsTrigger>
            </TabsList>

            {/* 纯色背景 */}
            <TabsContent value="color" className="space-y-3 mt-3">
              <div className="grid grid-cols-4 gap-2">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => handleBackgroundChange('color', color)}
                    title={color}
                  />
                ))}
              </div>
              
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: background?.type === 'color' ? background.value : '#FFFFFF' }}
                />
                <Input
                  value={background?.type === 'color' ? background.value : '#FFFFFF'}
                  onChange={(e) => handleBackgroundChange('color', e.target.value)}
                  className="flex-1 h-8"
                  placeholder="#FFFFFF"
                />
              </div>
            </TabsContent>

            {/* 渐变背景 */}
            <TabsContent value="gradient" className="space-y-3 mt-3">
              <div className="grid grid-cols-1 gap-2">
                {gradientPresets.map((gradient) => (
                  <button
                    key={gradient.name}
                    className="h-12 rounded border-2 border-gray-300 dark:border-gray-600 hover:scale-105 transition-transform relative overflow-hidden"
                    style={{ background: gradient.value }}
                    onClick={() => handleBackgroundChange('gradient', gradient.value)}
                  >
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <span className="text-white text-xs font-medium">{gradient.name}</span>
                    </div>
                  </button>
                ))}
              </div>
              
              <div>
                <Label className="text-xs text-gray-600 dark:text-gray-400">自定义渐变</Label>
                <Input
                  value={background?.type === 'gradient' ? background.value : ''}
                  onChange={(e) => handleBackgroundChange('gradient', e.target.value)}
                  className="h-8 mt-1"
                  placeholder="linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)"
                />
              </div>
            </TabsContent>

            {/* 图片背景 */}
            <TabsContent value="image" className="space-y-3 mt-3">
              <div className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8"
                  onClick={() => {
                    // 打开文件选择器
                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.accept = 'image/*';
                    fileInput.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          const result = e.target?.result as string;
                          updateSlideBackground(activeSlideIndex, {
                            type: 'image',
                            value: result,
                            imageSize: 'cover',
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                    };
                    fileInput.click();
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  上传图片
                </Button>
                
                {background?.type === 'image' && (
                  <>
                    <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded border overflow-hidden">
                      <img
                        src={background.value}
                        alt="背景图片"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs text-gray-600 dark:text-gray-400">显示方式</Label>
                      <Select
                        value={background.imageSize || 'cover'}
                        onValueChange={(value) => {
                          const newBackground = { ...background, imageSize: value as any };
                          updateSlideBackground(activeSlideIndex, newBackground);
                        }}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cover">覆盖</SelectItem>
                          <SelectItem value="contain">包含</SelectItem>
                          <SelectItem value="repeat">重复</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full h-8"
                      onClick={() => handleBackgroundChange('color', '#FFFFFF')}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      移除背景图片
                    </Button>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 主题设置 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Palette className="w-4 h-4" />
            主题配色
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div 
              className="h-12 rounded border-2 border-gray-300 dark:border-gray-600 cursor-pointer relative overflow-hidden"
              style={{ 
                background: `linear-gradient(135deg, ${currentTheme.colors.primary} 0%, ${currentTheme.colors.secondary} 100%)` 
              }}
              onClick={() => {
                // TODO: 打开主题选择器
                console.log('Open theme selector');
              }}
            >
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <span className="text-white text-xs font-medium">{currentTheme.name}</span>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              className="h-12"
              onClick={() => {
                // TODO: 打开主题编辑器
                console.log('Open theme editor');
              }}
            >
              <Palette className="w-4 h-4 mr-2" />
              自定义主题
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}