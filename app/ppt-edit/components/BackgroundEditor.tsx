'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Z_INDEX } from '../constants/z-index';
import { 
  Palette, 
  Image as ImageIcon,
  Paintbrush,
  Upload,
  Trash2
} from 'lucide-react';
import { usePPTStore } from '../store/ppt-store';
import { ColorPicker } from './ColorPicker';
import { MediaUploader } from './MediaUploader';
import { cn } from '@/lib/utils';

interface BackgroundEditorProps {
  trigger?: React.ReactNode;
}

export function BackgroundEditor({ trigger }: BackgroundEditorProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('color');
  
  const {
    slides,
    activeSlideIndex,
    updateSlideBackground,
  } = usePPTStore();

  const currentSlide = slides[activeSlideIndex];
  const background = currentSlide?.background;

  if (!currentSlide) return null;

  const predefinedColors = [
    '#FFFFFF', '#F8FAFC', '#F1F5F9', '#E2E8F0',
    '#EEF2FF', '#E0E7FF', '#C7D2FE', '#A5B4FC',
    '#6366F1', '#4F46E5', '#4338CA', '#3730A3',
    '#1E293B', '#0F172A', '#000000', '#374151',
    '#FEF2F2', '#FEE2E2', '#FECACA', '#F87171',
    '#EF4444', '#DC2626', '#B91C1C', '#991B1B',
    '#F0FDF4', '#DCFCE7', '#BBF7D0', '#86EFAC',
    '#22C55E', '#16A34A', '#15803D', '#166534',
    '#FFFBEB', '#FEF3C7', '#FDE68A', '#FCD34D',
    '#F59E0B', '#D97706', '#B45309', '#92400E',
  ];

  const gradientPresets = [
    {
      name: '紫色科技',
      value: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
      preview: 'bg-gradient-to-br from-purple-500 to-purple-600',
    },
    {
      name: '蓝色渐变',
      value: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
      preview: 'bg-gradient-to-br from-blue-500 to-blue-600',
    },
    {
      name: '绿色清新',
      value: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      preview: 'bg-gradient-to-br from-green-500 to-green-600',
    },
    {
      name: '橙色活力',
      value: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      preview: 'bg-gradient-to-br from-orange-500 to-orange-600',
    },
    {
      name: '粉色梦幻',
      value: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
      preview: 'bg-gradient-to-br from-pink-500 to-pink-600',
    },
    {
      name: '灰色简约',
      value: 'linear-gradient(135deg, #6B7280 0%, #374151 100%)',
      preview: 'bg-gradient-to-br from-gray-500 to-gray-600',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Palette className="w-4 h-4" />
            背景设置
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto" style={{ zIndex: Z_INDEX.DIALOG }}>
        <DialogHeader>
          <DialogTitle>幻灯片背景设置</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="color" className="flex items-center gap-1">
              <Palette className="w-3 h-3" />
              纯色
            </TabsTrigger>
            <TabsTrigger value="gradient" className="flex items-center gap-1">
              <Gradient className="w-3 h-3" />
              渐变
            </TabsTrigger>
            <TabsTrigger value="image" className="flex items-center gap-1">
              <ImageIcon className="w-3 h-3" />
              图片
            </TabsTrigger>
          </TabsList>

          {/* 纯色背景 */}
          <TabsContent value="color" className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">选择颜色</Label>
              
              {/* 预设颜色 */}
              <div className="grid grid-cols-8 gap-2">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "w-8 h-8 rounded border-2 transition-all",
                      background?.type === 'color' && background.value === color
                        ? "border-purple-500 scale-110"
                        : "border-gray-300 hover:border-purple-400"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => handleBackgroundChange('color', color)}
                  />
                ))}
              </div>
              
              {/* 自定义颜色 */}
              <div className="space-y-2">
                <Label className="text-sm">自定义颜色</Label>
                <ColorPicker
                  color={background?.type === 'color' ? background.value : '#FFFFFF'}
                  onChange={(color) => handleBackgroundChange('color', color)}
                />
              </div>
            </div>
          </TabsContent>

          {/* 渐变背景 */}
          <TabsContent value="gradient" className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">渐变预设</Label>
              
              <div className="grid grid-cols-2 gap-3">
                {gradientPresets.map((gradient) => (
                  <button
                    key={gradient.name}
                    className={cn(
                      "relative h-16 rounded-lg border-2 transition-all overflow-hidden",
                      background?.type === 'gradient' && background.value === gradient.value
                        ? "border-purple-500 scale-105"
                        : "border-gray-300 hover:border-purple-400"
                    )}
                    onClick={() => handleBackgroundChange('gradient', gradient.value)}
                  >
                    <div className={cn("w-full h-full", gradient.preview)} />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <span className="text-white text-xs font-medium">{gradient.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* 图片背景 */}
          <TabsContent value="image" className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">上传背景图片</Label>
              
              <MediaUploader 
                accept="image/*"
                onUpload={(url) => {
                  handleBackgroundChange('image', url);
                  setIsOpen(false);
                }}
              />
              
              {/* 当前背景图片预览 */}
              {background?.type === 'image' && background.value && (
                <div className="space-y-2">
                  <Label className="text-sm">当前背景</Label>
                  <div className="relative group">
                    <img 
                      src={background.value} 
                      alt="背景图片" 
                      className="w-full h-24 object-cover rounded border"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleBackgroundChange('color', '#FFFFFF')}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* 预览区域 */}
        <div className="mt-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <Label className="text-sm font-medium mb-2 block">预览效果</Label>
          <div 
            className="w-full h-24 rounded border-2 border-dashed border-gray-300 dark:border-gray-600 relative overflow-hidden"
            style={{
              background: background?.type === 'color' 
                ? background.value
                : background?.type === 'gradient'
                ? background.value
                : background?.type === 'image'
                ? `url(${background.value}) center/cover`
                : '#FFFFFF'
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs text-gray-500 bg-white/80 px-2 py-1 rounded">
                幻灯片预览
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  function handleBackgroundChange(type: 'color' | 'image' | 'gradient', value: string) {
    updateSlideBackground(activeSlideIndex, {
      type,
      value,
    });
  }
}