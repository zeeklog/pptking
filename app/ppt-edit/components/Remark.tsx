'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronUp, 
  ChevronDown, 
  StickyNote,
  Type,
  Bold,
  Italic,
  Underline
} from 'lucide-react';
import { usePPTStore } from '../store/ppt-store';
import { cn } from '@/lib/utils';

export function Remark() {
  const { t } = useTranslation();
  const [isRichText, setIsRichText] = useState(false);
  
  const {
    slides,
    activeSlideIndex,
    remarkHeight,
    showRemark,
    toggleRemark,
    updateSlideNotes,
  } = usePPTStore();

  const currentSlide = slides[activeSlideIndex];
  const notes = currentSlide?.notes || '';

  if (!showRemark) {
    return (
      <div className="h-8 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-3"
          onClick={toggleRemark}
        >
          <StickyNote className="w-4 h-4 mr-1" />
          <span className="text-xs">显示备注</span>
          <ChevronUp className="w-3 h-3 ml-1" />
        </Button>
      </div>
    );
  }

  return (
    <div 
      className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex flex-col"
      style={{ height: remarkHeight }}
    >
      {/* 头部工具栏 */}
      <div className="h-10 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            演讲者备注
          </span>
          
          {/* 富文本工具栏 */}
          {isRichText && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="加粗">
                  <Bold className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="斜体">
                  <Italic className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="下划线">
                  <Underline className="w-3 h-3" />
                </Button>
              </div>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant={isRichText ? "default" : "ghost"}
            size="sm"
            className="h-6 px-2"
            onClick={() => setIsRichText(!isRichText)}
          >
            <Type className="w-3 h-3 mr-1" />
            <span className="text-xs">富文本</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={toggleRemark}
            title="隐藏备注"
          >
            <ChevronDown className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* 备注内容区域 */}
      <div className="flex-1 p-4">
        <Textarea
          value={notes}
          onChange={(e) => updateSlideNotes(activeSlideIndex, e.target.value)}
          placeholder="在此输入演讲者备注..."
          className="w-full h-full resize-none border-none focus:ring-0 bg-transparent text-sm"
        />
      </div>
    </div>
  );
}