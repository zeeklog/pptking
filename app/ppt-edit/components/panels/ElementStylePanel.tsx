'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Palette,
  Type,
  Image as ImageIcon,
  Square,
  BarChart3,
  Table,
  Settings
} from 'lucide-react';
import { usePPTStore, PPTElement } from '../../store/ppt-store';
import { ColorPicker } from '../ColorPicker';
import { cn } from '@/lib/utils';

export function ElementStylePanel() {
  const { t } = useTranslation();
  const {
    slides,
    activeSlideIndex,
    activeElementIds,
    updateElement,
  } = usePPTStore();

  const currentSlide = slides[activeSlideIndex];
  const selectedElements = currentSlide?.elements.filter(el => 
    activeElementIds.includes(el.id)
  ) || [];

  const firstElement = selectedElements[0];
  const isMultiSelect = selectedElements.length > 1;

  if (!firstElement) {
    return (
      <div className="p-4 text-center text-gray-500">
        <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">选择元素以编辑样式</p>
      </div>
    );
  }

  // 文本样式编辑
  const renderTextStylePanel = (element: PPTElement) => {
    if (element.type !== 'text' || !element.text) return null;

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">字体设置</Label>
          <div className="grid grid-cols-2 gap-2">
            <Select 
              value={element.text.fontFamily} 
              onValueChange={(value) => updateElement(element.id, {
                text: { ...element.text!, fontFamily: value }
              })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Arial">Arial</SelectItem>
                <SelectItem value="微软雅黑">微软雅黑</SelectItem>
                <SelectItem value="宋体">宋体</SelectItem>
                <SelectItem value="黑体">黑体</SelectItem>
                <SelectItem value="楷体">楷体</SelectItem>
                <SelectItem value="Times New Roman">Times New Roman</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={element.text.fontSize}
                onChange={(e) => updateElement(element.id, {
                  text: { ...element.text!, fontSize: parseInt(e.target.value) || 16 }
                })}
                className="h-8"
                min="8"
                max="72"
              />
              <span className="text-xs text-gray-500">px</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">文本格式</Label>
          <div className="flex gap-1">
            <Button
              variant={element.text.bold ? "default" : "outline"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => updateElement(element.id, {
                text: { ...element.text!, bold: !element.text.bold }
              })}
            >
              <Bold className="w-3 h-3" />
            </Button>
            <Button
              variant={element.text.italic ? "default" : "outline"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => updateElement(element.id, {
                text: { ...element.text!, italic: !element.text.italic }
              })}
            >
              <Italic className="w-3 h-3" />
            </Button>
            <Button
              variant={element.text.underline ? "default" : "outline"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => updateElement(element.id, {
                text: { ...element.text!, underline: !element.text.underline }
              })}
            >
              <Underline className="w-3 h-3" />
            </Button>
            <Button
              variant={element.text.strikethrough ? "default" : "outline"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => updateElement(element.id, {
                text: { ...element.text!, strikethrough: !element.text.strikethrough }
              })}
            >
              <Strikethrough className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">对齐方式</Label>
          <div className="flex gap-1">
            <Button
              variant={element.text.align === 'left' ? "default" : "outline"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => updateElement(element.id, {
                text: { ...element.text!, align: 'left' }
              })}
            >
              <AlignLeft className="w-3 h-3" />
            </Button>
            <Button
              variant={element.text.align === 'center' ? "default" : "outline"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => updateElement(element.id, {
                text: { ...element.text!, align: 'center' }
              })}
            >
              <AlignCenter className="w-3 h-3" />
            </Button>
            <Button
              variant={element.text.align === 'right' ? "default" : "outline"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => updateElement(element.id, {
                text: { ...element.text!, align: 'right' }
              })}
            >
              <AlignRight className="w-3 h-3" />
            </Button>
            <Button
              variant={element.text.align === 'justify' ? "default" : "outline"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => updateElement(element.id, {
                text: { ...element.text!, align: 'justify' }
              })}
            >
              <AlignJustify className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">文字颜色</Label>
          <ColorPicker
            color={element.text.color}
            onChange={(color) => updateElement(element.id, {
              text: { ...element.text!, color }
            })}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">行高</Label>
          <Slider
            value={[element.text.lineHeight]}
            onValueChange={([value]) => updateElement(element.id, {
              text: { ...element.text!, lineHeight: value }
            })}
            min={1}
            max={3}
            step={0.1}
            className="w-full"
          />
          <div className="text-xs text-gray-500 text-center">
            {element.text.lineHeight.toFixed(1)}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">字间距</Label>
          <Slider
            value={[element.text.letterSpacing]}
            onValueChange={([value]) => updateElement(element.id, {
              text: { ...element.text!, letterSpacing: value }
            })}
            min={-2}
            max={10}
            step={0.5}
            className="w-full"
          />
          <div className="text-xs text-gray-500 text-center">
            {element.text.letterSpacing}px
          </div>
        </div>
      </div>
    );
  };

  // 形状样式编辑
  const renderShapeStylePanel = (element: PPTElement) => {
    if (element.type !== 'shape' || !element.shape) return null;

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">填充颜色</Label>
          <ColorPicker
            color={element.shape.fill}
            onChange={(color) => updateElement(element.id, {
              shape: { ...element.shape!, fill: color }
            })}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">边框颜色</Label>
          <ColorPicker
            color={element.shape.stroke}
            onChange={(color) => updateElement(element.id, {
              shape: { ...element.shape!, stroke: color }
            })}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">边框宽度</Label>
          <Slider
            value={[element.shape.strokeWidth]}
            onValueChange={([value]) => updateElement(element.id, {
              shape: { ...element.shape!, strokeWidth: value }
            })}
            min={0}
            max={10}
            step={1}
            className="w-full"
          />
          <div className="text-xs text-gray-500 text-center">
            {element.shape.strokeWidth}px
          </div>
        </div>
      </div>
    );
  };

  // 图片样式编辑
  const renderImageStylePanel = (element: PPTElement) => {
    if (element.type !== 'image' || !element.image) return null;

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">圆角</Label>
          <Slider
            value={[element.image.borderRadius]}
            onValueChange={([value]) => updateElement(element.id, {
              image: { ...element.image!, borderRadius: value }
            })}
            min={0}
            max={50}
            step={1}
            className="w-full"
          />
          <div className="text-xs text-gray-500 text-center">
            {element.image.borderRadius}px
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">滤镜效果</Label>
          
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-600">模糊</Label>
              <Slider
                value={[element.image.filters.blur]}
                onValueChange={([value]) => updateElement(element.id, {
                  image: { 
                    ...element.image!, 
                    filters: { ...element.image!.filters, blur: value }
                  }
                })}
                min={0}
                max={10}
                step={0.5}
                className="w-full"
              />
            </div>
            
            <div>
              <Label className="text-xs text-gray-600">亮度</Label>
              <Slider
                value={[element.image.filters.brightness]}
                onValueChange={([value]) => updateElement(element.id, {
                  image: { 
                    ...element.image!, 
                    filters: { ...element.image!.filters, brightness: value }
                  }
                })}
                min={0}
                max={200}
                step={5}
                className="w-full"
              />
            </div>
            
            <div>
              <Label className="text-xs text-gray-600">对比度</Label>
              <Slider
                value={[element.image.filters.contrast]}
                onValueChange={([value]) => updateElement(element.id, {
                  image: { 
                    ...element.image!, 
                    filters: { ...element.image!.filters, contrast: value }
                  }
                })}
                min={0}
                max={200}
                step={5}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 通用样式编辑
  const renderCommonStylePanel = (element: PPTElement) => {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">透明度</Label>
          <Slider
            value={[element.opacity * 100]}
            onValueChange={([value]) => updateElement(element.id, {
              opacity: value / 100
            })}
            min={0}
            max={100}
            step={5}
            className="w-full"
          />
          <div className="text-xs text-gray-500 text-center">
            {Math.round(element.opacity * 100)}%
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">旋转角度</Label>
          <Slider
            value={[element.rotation]}
            onValueChange={([value]) => updateElement(element.id, {
              rotation: value
            })}
            min={-180}
            max={180}
            step={1}
            className="w-full"
          />
          <div className="text-xs text-gray-500 text-center">
            {element.rotation}°
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">元素名称</Label>
          <Input
            value={element.name || ''}
            onChange={(e) => updateElement(element.id, {
              name: e.target.value
            })}
            placeholder="输入元素名称"
            className="h-8"
          />
        </div>
      </div>
    );
  };

  if (isMultiSelect) {
    return (
      <div className="p-4">
        <div className="text-center mb-4">
          <h3 className="font-medium">多选元素 ({selectedElements.length})</h3>
          <p className="text-sm text-gray-500">选择了多个元素</p>
        </div>
        
        {/* 多选时只显示通用属性 */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">透明度</Label>
            <Slider
              value={[firstElement.opacity * 100]}
              onValueChange={([value]) => {
                selectedElements.forEach(el => {
                  updateElement(el.id, { opacity: value / 100 });
                });
              }}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">旋转角度</Label>
            <Slider
              value={[firstElement.rotation]}
              onValueChange={([value]) => {
                selectedElements.forEach(el => {
                  updateElement(el.id, { rotation: value });
                });
              }}
              min={-180}
              max={180}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* 元素类型标识 */}
      <div className="flex items-center gap-2 mb-4">
        {firstElement.type === 'text' && <Type className="w-4 h-4 text-purple-600" />}
        {firstElement.type === 'image' && <ImageIcon className="w-4 h-4 text-purple-600" />}
        {firstElement.type === 'shape' && <Square className="w-4 h-4 text-purple-600" />}
        {firstElement.type === 'chart' && <BarChart3 className="w-4 h-4 text-purple-600" />}
        {firstElement.type === 'table' && <Table className="w-4 h-4 text-purple-600" />}
        <span className="font-medium capitalize">{firstElement.type} 元素</span>
      </div>

      <Tabs defaultValue="style" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="style">样式</TabsTrigger>
          <TabsTrigger value="common">通用</TabsTrigger>
        </TabsList>
        
        <TabsContent value="style" className="space-y-4 mt-4">
          {renderTextStylePanel(firstElement)}
          {renderShapeStylePanel(firstElement)}
          {renderImageStylePanel(firstElement)}
        </TabsContent>
        
        <TabsContent value="common" className="space-y-4 mt-4">
          {renderCommonStylePanel(firstElement)}
        </TabsContent>
      </Tabs>
    </div>
  );
}