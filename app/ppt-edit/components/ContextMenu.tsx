'use client';

import { useTranslation } from 'react-i18next';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { 
  Copy, 
  Scissors,
  Trash2, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown,
  RotateCw,
  Palette,
  Edit,
  Square,
  BarChart3,
  Group,
  Ungroup
} from 'lucide-react';
import { usePPTStore, PPTElement } from '../store/ppt-store';

interface ElementContextMenuProps {
  element: PPTElement;
  children: React.ReactNode;
}

export function ElementContextMenu({ element, children }: ElementContextMenuProps) {
  const { t } = useTranslation();
  const {
    duplicateElement,
    deleteElement,
    lockElement,
    unlockElement,
    hideElement,
    showElement,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    startEditing,
    startFormatPainter,
    copyElements,
    cutElements,
    activeElementIds,
    groupElements,
    ungroupElements,
    slides,
    activeSlideIndex,
  } = usePPTStore();

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48 z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
        {/* 编辑操作 */}
        {element.type === 'text' && (
          <>
            <ContextMenuItem onClick={() => startEditing(element.id)}>
              <Edit className="w-4 h-4 mr-2" />
              编辑文本
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}

        {/* 基础操作 */}
        <ContextMenuItem onClick={() => copyElements([element.id])}>
          <Copy className="w-4 h-4 mr-2" />
          复制 (Ctrl+C)
        </ContextMenuItem>
        
        <ContextMenuItem onClick={() => cutElements([element.id])}>
          <Scissors className="w-4 h-4 mr-2" />
          剪切 (Ctrl+X)
        </ContextMenuItem>
        
        <ContextMenuItem onClick={() => duplicateElement(element.id)}>
          <Copy className="w-4 h-4 mr-2" />
          重复 (Ctrl+D)
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={() => deleteElement(element.id)}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          删除 (Delete)
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* 格式刷 */}
        {(element.type === 'text' || element.type === 'shape') && (
          <ContextMenuItem 
            onClick={() => startFormatPainter(element.id, element.type as 'text' | 'shape')}
          >
            <Palette className="w-4 h-4 mr-2" />
            格式刷
          </ContextMenuItem>
        )}

        {/* 组合/取消组合 */}
        {(() => {
          const isMultipleSelected = activeElementIds.length > 1;
          const isSingleGroupSelected = element.type === 'group' && activeElementIds.length === 1;
          
          if (!isMultipleSelected && !isSingleGroupSelected) return null;
          
          return (
            <>
              <ContextMenuSeparator />
              {isMultipleSelected && (
                <ContextMenuItem onClick={() => groupElements(activeElementIds)}>
                  <Group className="w-4 h-4 mr-2" />
                  组合元素 (Ctrl+G)
                </ContextMenuItem>
              )}
              {isSingleGroupSelected && (
                <ContextMenuItem onClick={() => ungroupElements(element.id)}>
                  <Ungroup className="w-4 h-4 mr-2" />
                  取消组合 (Ctrl+Shift+G)
                </ContextMenuItem>
              )}
            </>
          );
        })()}

        {/* 图层操作 */}
        <ContextMenuItem onClick={() => bringToFront(element.id)}>
          <ArrowUp className="w-4 h-4 mr-2" />
          置于顶层
        </ContextMenuItem>
        
        <ContextMenuItem onClick={() => bringForward(element.id)}>
          <ArrowUp className="w-4 h-4 mr-2" />
          上移一层
        </ContextMenuItem>
        
        <ContextMenuItem onClick={() => sendBackward(element.id)}>
          <ArrowDown className="w-4 h-4 mr-2" />
          下移一层
        </ContextMenuItem>
        
        <ContextMenuItem onClick={() => sendToBack(element.id)}>
          <ArrowDown className="w-4 h-4 mr-2" />
          置于底层
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* 锁定和隐藏 */}
        <ContextMenuItem 
          onClick={() => element.locked ? unlockElement(element.id) : lockElement(element.id)}
        >
          {element.locked ? (
            <>
              <Unlock className="w-4 h-4 mr-2" />
              解锁
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 mr-2" />
              锁定
            </>
          )}
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={() => element.hidden ? showElement(element.id) : hideElement(element.id)}
        >
          {element.hidden ? (
            <>
              <Eye className="w-4 h-4 mr-2" />
              显示
            </>
          ) : (
            <>
              <EyeOff className="w-4 h-4 mr-2" />
              隐藏
            </>
          )}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

interface CanvasContextMenuProps {
  children: React.ReactNode;
  onAddElement?: (type: PPTElement['type']) => void;
}

export function CanvasContextMenu({ children, onAddElement }: CanvasContextMenuProps) {
  const { t } = useTranslation();

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48 z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
        <ContextMenuItem onClick={() => onAddElement?.('text')}>
          <Edit className="w-4 h-4 mr-2" />
          添加文本
        </ContextMenuItem>
        
        <ContextMenuItem onClick={() => onAddElement?.('shape')}>
          <Square className="w-4 h-4 mr-2" />
          添加形状
        </ContextMenuItem>
        
        <ContextMenuItem onClick={() => onAddElement?.('image')}>
          <Copy className="w-4 h-4 mr-2" />
          添加图片
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={() => onAddElement?.('table')}>
          <Copy className="w-4 h-4 mr-2" />
          添加表格
        </ContextMenuItem>
        
        <ContextMenuItem onClick={() => onAddElement?.('chart')}>
          <BarChart3 className="w-4 h-4 mr-2" />
          添加图表
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}