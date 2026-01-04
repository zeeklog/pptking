'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Palette, Pipette, Paintbrush } from 'lucide-react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  showGradient?: boolean;
  className?: string;
}

export function ColorPicker({ color, onChange, showGradient = false, className = '' }: ColorPickerProps) {
  // 从HEX解析HSL - 必须在所有使用之前定义
  const hexToHsl = (hex: string) => {
    // 处理无效输入
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
      return { h: 0, s: 0, l: 0 };
    }

    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  };

  const [hue, setHue] = useState(() => hexToHsl(color).h);
  const [saturation, setSaturation] = useState(() => hexToHsl(color).s);
  const [lightness, setLightness] = useState(() => hexToHsl(color).l);

  // 当 color 改变时更新 HSL 值
  useEffect(() => {
    if (color && color.startsWith('#')) {
      const hsl = hexToHsl(color);
      setHue(hsl.h);
      setSaturation(hsl.s);
      setLightness(hsl.l);
    }
  }, [color]);

  // 预设颜色
  const presetColors = [
    // 特殊颜色（透明）
    'transparent',
    
    // 主题紫色系
    '#6366F1', '#4F46E5', '#3730A3', '#312E81',
    '#EEF2FF', '#E0E7FF', '#C7D2FE', '#A5B4FC',
    
    // 功能色系
    '#10B981', '#059669', '#047857', '#065F46', // 绿色
    '#EF4444', '#DC2626', '#B91C1C', '#991B1B', // 红色
    '#F59E0B', '#D97706', '#B45309', '#92400E', // 橙色
    '#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF', // 蓝色
    
    // 灰色系
    '#FFFFFF', '#F9FAFB', '#F3F4F6', '#E5E7EB',
    '#D1D5DB', '#9CA3AF', '#6B7280', '#374151',
    '#1F2937', '#111827', '#000000',
  ];

  // 渐变预设
  const gradientPresets = [
    'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
    'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
    'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
  ];


  // 转换HSL到HEX
  const hslToHex = (h: number, s: number, l: number) => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-8 h-8 p-0 border-2 relative ${className} ${
            color === 'transparent' ? 'bg-gray-100 dark:bg-gray-700' : ''
          }`}
          style={{ backgroundColor: color === 'transparent' ? undefined : color }}
          title="选择颜色"
        >
          {!color && <Palette className="w-4 h-4" />}
          {color === 'transparent' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-0.5 bg-red-500 transform rotate-45"></div>
              <div className="w-6 h-0.5 bg-red-500 transform -rotate-45 absolute"></div>
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Tabs defaultValue="presets" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-10">
            <TabsTrigger value="presets" className="text-xs">预设</TabsTrigger>
            <TabsTrigger value="custom" className="text-xs">自定义</TabsTrigger>
            {showGradient && <TabsTrigger value="gradient" className="text-xs">渐变</TabsTrigger>}
          </TabsList>

          {/* 预设颜色 */}
          <TabsContent value="presets" className="p-3 space-y-3">
            <div className="grid grid-cols-8 gap-2">
              {presetColors.map((color) => (
                <button
                  key={color}
                  className={`w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform relative ${
                    color === 'transparent' ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                  style={{ backgroundColor: color === 'transparent' ? undefined : color }}
                  onClick={() => onChange(color)}
                  title={color === 'transparent' ? '透明' : color}
                >
                  {color === 'transparent' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-0.5 bg-red-500 transform rotate-45"></div>
                      <div className="w-6 h-0.5 bg-red-500 transform -rotate-45 absolute"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600 relative ${
                  color === 'transparent' ? 'bg-gray-100 dark:bg-gray-700' : ''
                }`}
                style={{ backgroundColor: color === 'transparent' ? undefined : color }}
              >
                {color === 'transparent' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-0.5 bg-red-500 transform rotate-45"></div>
                    <div className="w-6 h-0.5 bg-red-500 transform -rotate-45 absolute"></div>
                  </div>
                )}
              </div>
              <Input
                value={color}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 h-8"
                placeholder="#000000"
              />
            </div>
          </TabsContent>

          {/* 自定义颜色 */}
          <TabsContent value="custom" className="p-3 space-y-4">
            {/* 色相 */}
            <div>
              <Label className="text-xs text-gray-600 dark:text-gray-400">色相</Label>
              <Slider
                value={[hue]}
                onValueChange={(value) => {
                  setHue(value[0]);
                  onChange(hslToHex(value[0], saturation, lightness));
                }}
                min={0}
                max={360}
                step={1}
                className="mt-1"
              />
            </div>

            {/* 饱和度 */}
            <div>
              <Label className="text-xs text-gray-600 dark:text-gray-400">饱和度</Label>
              <Slider
                value={[saturation]}
                onValueChange={(value) => {
                  setSaturation(value[0]);
                  onChange(hslToHex(hue, value[0], lightness));
                }}
                min={0}
                max={100}
                step={1}
                className="mt-1"
              />
            </div>

            {/* 明度 */}
            <div>
              <Label className="text-xs text-gray-600 dark:text-gray-400">明度</Label>
              <Slider
                value={[lightness]}
                onValueChange={(value) => {
                  setLightness(value[0]);
                  onChange(hslToHex(hue, saturation, value[0]));
                }}
                min={0}
                max={100}
                step={1}
                className="mt-1"
              />
            </div>

            {/* 预览和输入 */}
            <div className="flex items-center gap-2">
              <div 
                className="w-12 h-8 rounded border-2 border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: hslToHex(hue, saturation, lightness) }}
              />
              <Input
                value={hslToHex(hue, saturation, lightness)}
                onChange={(e) => {
                  onChange(e.target.value);
                  const hsl = hexToHsl(e.target.value);
                  setHue(hsl.h);
                  setSaturation(hsl.s);
                  setLightness(hsl.l);
                }}
                className="flex-1 h-8"
                placeholder="#000000"
              />
            </div>
          </TabsContent>

          {/* 渐变颜色 */}
          {showGradient && (
            <TabsContent value="gradient" className="p-3 space-y-3">
              <div className="grid grid-cols-1 gap-2">
                {gradientPresets.map((gradient, index) => (
                  <button
                    key={index}
                    className="h-8 rounded border-2 border-gray-300 dark:border-gray-600 hover:scale-105 transition-transform"
                    style={{ background: gradient }}
                    onClick={() => onChange(gradient)}
                    title={gradient}
                  />
                ))}
              </div>
              
              <div>
                <Label className="text-xs text-gray-600 dark:text-gray-400">自定义渐变</Label>
                <Input
                  value={color.startsWith('linear-gradient') ? color : ''}
                  onChange={(e) => onChange(e.target.value)}
                  className="h-8 mt-1"
                  placeholder="linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)"
                />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}