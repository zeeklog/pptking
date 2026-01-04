'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  ArrowRight,
  ArrowDown,
  Group,
  Ungroup,
  RotateCw,
  FlipHorizontal,
  FlipVertical
} from 'lucide-react';
import { usePPTStore } from '../store/ppt-store';
import { cn } from '@/lib/utils';

export function AlignmentToolbar() {
  const {
    activeElementIds,
    slides,
    activeSlideIndex,
    alignElements,
    distributeElements,
    groupElements,
    ungroupElements,
    updateElementBatch,
  } = usePPTStore();

  const currentSlide = slides[activeSlideIndex];
  const selectedElements = currentSlide?.elements.filter(el => activeElementIds.includes(el.id)) || [];

  if (selectedElements.length === 0) {
    return null;
  }

  const canGroup = selectedElements.length > 1;
  const canUngroup = selectedElements.length === 1 && selectedElements[0].isGroup;
  const canDistribute = selectedElements.length > 2;

  // 翻转元素
  const flipElements = (direction: 'horizontal' | 'vertical') => {
    const updates = selectedElements.map(element => ({
      elementId: element.id,
      updates: {
        rotation: direction === 'horizontal' 
          ? (element.rotation + 180) % 360 
          : element.rotation, // 垂直翻转需要更复杂的变换
      }
    }));
    
    updateElementBatch(updates, `翻转元素-${direction === 'horizontal' ? '水平' : '垂直'}`);
  };

  // 旋转元素
  const rotateElements = (angle: number) => {
    const updates = selectedElements.map(element => ({
      elementId: element.id,
      updates: {
        rotation: (element.rotation + angle) % 360,
      }
    }));
    
    updateElementBatch(updates, `旋转元素${angle}度`);
  };

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-2 flex items-center gap-1 z-50">
      {/* 水平对齐 */}
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => alignElements('left', activeElementIds)}
          title="左对齐"
        >
          <AlignHorizontalJustifyStart className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => alignElements('center', activeElementIds)}
          title="水平居中"
        >
          <AlignHorizontalJustifyCenter className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => alignElements('right', activeElementIds)}
          title="右对齐"
        >
          <AlignHorizontalJustifyEnd className="w-4 h-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* 垂直对齐 */}
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => alignElements('top', activeElementIds)}
          title="顶部对齐"
        >
          <AlignVerticalJustifyStart className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => alignElements('middle', activeElementIds)}
          title="垂直居中"
        >
          <AlignVerticalJustifyCenter className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => alignElements('bottom', activeElementIds)}
          title="底部对齐"
        >
          <AlignVerticalJustifyEnd className="w-4 h-4" />
        </Button>
      </div>

      {/* 分布 */}
      {canDistribute && (
        <>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => distributeElements('horizontal', activeElementIds)}
              title="水平分布"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => distributeElements('vertical', activeElementIds)}
              title="垂直分布"
            >
              <ArrowDown className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}

      <Separator orientation="vertical" className="h-6" />

      {/* 组合操作 */}
      <div className="flex gap-1">
        {canGroup && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => groupElements(activeElementIds)}
            title="组合 (Ctrl+G)"
          >
            <Group className="w-4 h-4" />
          </Button>
        )}
        
        {canUngroup && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => ungroupElements(activeElementIds[0])}
            title="取消组合 (Ctrl+Shift+G)"
          >
            <Ungroup className="w-4 h-4" />
          </Button>
        )}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* 旋转和翻转 */}
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => rotateElements(-90)}
          title="逆时针旋转90°"
        >
          <RotateCw className="w-4 h-4 transform -scale-x-100" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => rotateElements(90)}
          title="顺时针旋转90°"
        >
          <RotateCw className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => flipElements('horizontal')}
          title="水平翻转"
        >
          <FlipHorizontal className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => flipElements('vertical')}
          title="垂直翻转"
        >
          <FlipVertical className="w-4 h-4" />
        </Button>
      </div>

      {/* 选中元素数量指示 */}
      <Separator orientation="vertical" className="h-6" />
      <div className="text-xs text-gray-500 px-2">
        已选择 {selectedElements.length} 个元素
      </div>
    </div>
  );
}