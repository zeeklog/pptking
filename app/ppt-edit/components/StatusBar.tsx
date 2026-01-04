'use client';

import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Layers,
  Save
} from 'lucide-react';
import { usePPTStore } from '../store/ppt-store';
import { cn } from '@/lib/utils';

export function StatusBar() {
  const { t } = useTranslation();
  const {
    slides,
    activeSlideIndex,
    activeElementIds,
    canvasScale,
    title,
    exportToJSON,
  } = usePPTStore();

  const currentSlide = slides[activeSlideIndex];
  const selectedCount = activeElementIds.length;


  return (
    <div 
      className="h-8 border-t flex items-center justify-between px-4 text-xs"
      style={{ 
        backgroundColor: '#FFFFFF',
        borderTopColor: '#C7D2FE',
        color: '#6B7280'
      }}
    >
      {/* 左侧状态信息 */}
      <div className="flex items-center gap-4">
        
        {/* 缩放比例 */}
        <div className="flex items-center gap-1">
          <span>缩放: {Math.round(canvasScale * 100)}%</span>
        </div>
        
        {/* 幻灯片信息 */}
        <div className="flex items-center gap-1">
          <Layers className="w-3 h-3" />
          <span>{activeSlideIndex + 1} / {slides.length}</span>
        </div>
        
        {/* 选中元素数量 */}
        {selectedCount > 0 && (
          <Badge 
            variant="outline" 
            className="h-5 px-2 text-xs"
            style={{ 
              borderColor: '#C7D2FE',
              color: '#6366F1',
              backgroundColor: '#EEF2FF'
            }}
          >
            已选择 {selectedCount} 个元素
          </Badge>
        )}
      </div>

      {/* 右侧操作按钮 */}
      <div className="flex items-center gap-2">
        {/* 自动保存 */}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={exportToJSON}
          title="手动保存"
        >
          <Save className="w-3 h-3 mr-1" />
          保存
        </Button>
      </div>
    </div>
  );
}