'use client';

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyEnd,
  Move,
  RotateCw,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  Settings
} from 'lucide-react';
import { usePPTStore } from '../../store/ppt-store';
import { cn } from '@/lib/utils';
import { getCanvasDimensions } from '../../constants/canvas';

export function ElementPositionPanel() {
  const { t } = useTranslation();
  const {
    slides,
    activeSlideIndex,
    activeElementIds,
    updateElement,
    deleteElement,
    duplicateElement,
    lockElement,
    unlockElement,
    hideElement,
    showElement,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
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
        <p className="text-sm">选择元素以编辑位置</p>
      </div>
    );
  }

  // 对齐功能
  const alignElements = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (selectedElements.length === 0) return;

    const canvasDimensions = getCanvasDimensions();
    const canvasWidth = canvasDimensions.width;
    const canvasHeight = canvasDimensions.height;

    selectedElements.forEach(element => {
      let newX = element.x;
      let newY = element.y;

      switch (type) {
        case 'left':
          newX = 0;
          break;
        case 'center':
          newX = (canvasWidth - element.width) / 2;
          break;
        case 'right':
          newX = canvasWidth - element.width;
          break;
        case 'top':
          newY = 0;
          break;
        case 'middle':
          newY = (canvasHeight - element.height) / 2;
          break;
        case 'bottom':
          newY = canvasHeight - element.height;
          break;
      }

      updateElement(element.id, { x: newX, y: newY });
    });
  };

  return (
    <div className="p-4 space-y-4">
      {/* 元素信息 */}
      <div className="space-y-2">
        <h3 className="font-medium">
          {isMultiSelect ? `多选元素 (${selectedElements.length})` : '元素位置'}
        </h3>
      </div>

      {/* 位置设置 */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">位置坐标</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">X 坐标</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={Math.round(firstElement.x)}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  selectedElements.forEach(el => {
                    updateElement(el.id, { x: value });
                  });
                }}
                className="h-8"
                min="0"
              />
              <span className="text-xs text-gray-500">px</span>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Y 坐标</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={Math.round(firstElement.y)}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  selectedElements.forEach(el => {
                    updateElement(el.id, { y: value });
                  });
                }}
                className="h-8"
                min="0"
              />
              <span className="text-xs text-gray-500">px</span>
            </div>
          </div>
        </div>
      </div>

      {/* 尺寸设置 */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">元素尺寸</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">宽度</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={Math.round(firstElement.width)}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  selectedElements.forEach(el => {
                    updateElement(el.id, { width: Math.max(1, value) });
                  });
                }}
                className="h-8"
                min="1"
              />
              <span className="text-xs text-gray-500">px</span>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">高度</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={Math.round(firstElement.height)}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  selectedElements.forEach(el => {
                    updateElement(el.id, { height: Math.max(1, value) });
                  });
                }}
                className="h-8"
                min="1"
              />
              <span className="text-xs text-gray-500">px</span>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* 对齐工具 */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">对齐方式</Label>
        
        {/* 水平对齐 */}
        <div className="space-y-2">
          <Label className="text-xs text-gray-600">水平对齐</Label>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => alignElements('left')}
              title="左对齐"
            >
              <AlignLeft className="w-3 h-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => alignElements('center')}
              title="水平居中"
            >
              <AlignHorizontalJustifyCenter className="w-3 h-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => alignElements('right')}
              title="右对齐"
            >
              <AlignRight className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* 垂直对齐 */}
        <div className="space-y-2">
          <Label className="text-xs text-gray-600">垂直对齐</Label>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => alignElements('top')}
              title="顶部对齐"
            >
              <AlignVerticalJustifyStart className="w-3 h-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => alignElements('middle')}
              title="垂直居中"
            >
              <AlignVerticalJustifyCenter className="w-3 h-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => alignElements('bottom')}
              title="底部对齐"
            >
              <AlignVerticalJustifyEnd className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* 图层操作 */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">图层操作</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => bringToFront(firstElement.id)}
            className="h-8 gap-2"
          >
            <ArrowUp className="w-3 h-3" />
            置顶
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => sendToBack(firstElement.id)}
            className="h-8 gap-2"
          >
            <ArrowDown className="w-3 h-3" />
            置底
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => bringForward(firstElement.id)}
            className="h-8 gap-2"
          >
            <ArrowUp className="w-3 h-3" />
            上移
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => sendBackward(firstElement.id)}
            className="h-8 gap-2"
          >
            <ArrowDown className="w-3 h-3" />
            下移
          </Button>
        </div>
      </div>

      <Separator />

      {/* 元素操作 */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">元素操作</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => duplicateElement(firstElement.id)}
            className="h-8 gap-2"
          >
            <Copy className="w-3 h-3" />
            复制
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => deleteElement(firstElement.id)}
            className="h-8 gap-2 text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-3 h-3" />
            删除
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (firstElement.locked) {
                unlockElement(firstElement.id);
              } else {
                lockElement(firstElement.id);
              }
            }}
            className="h-8 gap-2"
          >
            {firstElement.locked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            {firstElement.locked ? '解锁' : '锁定'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (firstElement.hidden) {
                showElement(firstElement.id);
              } else {
                hideElement(firstElement.id);
              }
            }}
            className="h-8 gap-2"
          >
            {firstElement.hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {firstElement.hidden ? '显示' : '隐藏'}
          </Button>
        </div>
      </div>
    </div>
  );
}