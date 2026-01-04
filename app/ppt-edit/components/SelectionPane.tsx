'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Z_INDEX } from '../constants/z-index';
import { 
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  Search
} from 'lucide-react';
import { usePPTStore, PPTElement } from '../store/ppt-store';
import { cn } from '@/lib/utils';

interface SelectionPaneProps {
  trigger?: React.ReactNode;
}

export function SelectionPane({ trigger }: SelectionPaneProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingName, setEditingName] = useState<string | null>(null);

  const {
    slides,
    activeSlideIndex,
    activeElementIds,
    selectElements,
    updateElement,
    deleteElement,
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
  const elements = currentSlide?.elements || [];

  // 过滤元素
  const filteredElements = elements.filter(element => {
    if (!searchQuery.trim()) return true;
    
    const searchText = searchQuery.toLowerCase();
    const elementName = (element.name || getElementTypeName(element.type)).toLowerCase();
    const elementContent = getElementContent(element).toLowerCase();
    
    return elementName.includes(searchText) || elementContent.includes(searchText);
  });

  // 按z-index排序（从高到低）
  const sortedElements = [...filteredElements].sort((a, b) => b.zIndex - a.zIndex);

  // 获取元素类型名称
  const getElementTypeName = (type: string) => {
    const typeNames = {
      text: '文本',
      image: '图片',
      shape: '形状',
      line: '线条',
      chart: '图表',
      table: '表格',
      latex: '公式',
      video: '视频',
      audio: '音频',
      group: '组合',
    };
    return typeNames[type as keyof typeof typeNames] || type;
  };

  // 获取元素内容预览
  const getElementContent = (element: PPTElement) => {
    switch (element.type) {
      case 'text':
        return element.text?.content || '';
      case 'image':
        return element.image?.alt || '图片';
      case 'shape':
        return element.shape?.type || '形状';
      case 'group':
        const groupElements = (element as any).elements || element.groupedElements || [];
        return `组合 (${groupElements.length} 个元素)`;
      default:
        return getElementTypeName(element.type);
    }
  };

  // 获取元素图标
  const getElementIcon = (element: PPTElement) => {
    switch (element.type) {
      case 'text':
        return '📝';
      case 'image':
        return '🖼️';
      case 'shape':
        return '🔶';
      case 'line':
        return '📏';
      case 'chart':
        return '📊';
      case 'table':
        return '📋';
      case 'latex':
        return '🧮';
      case 'video':
        return '🎥';
      case 'audio':
        return '🎵';
      case 'group':
        return '📦';
      default:
        return '📄';
    }
  };

  // 重命名元素
  const handleRename = (elementId: string, newName: string) => {
    updateElement(elementId, { name: newName });
    setEditingName(null);
  };

  const defaultTrigger = (
    <Button variant="ghost" size="sm">
      <Layers className="w-4 h-4 mr-2" />
      选择窗格
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[80vh]" style={{ zIndex: Z_INDEX.DIALOG }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            选择窗格
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 搜索 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索元素..."
              className="pl-10"
            />
          </div>

          {/* 元素列表 */}
          <ScrollArea className="h-64 w-full">
            <div className="space-y-1">
              {sortedElements.map((element) => (
                <div
                  key={element.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors",
                    activeElementIds.includes(element.id)
                      ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800 border-transparent"
                  )}
                  onClick={() => selectElements([element.id])}
                >
                  {/* 元素图标 */}
                  <span className="text-sm">{getElementIcon(element)}</span>
                  
                  {/* 元素名称/内容 */}
                  <div className="flex-1 min-w-0">
                    {editingName === element.id ? (
                      <Input
                        value={element.name || getElementTypeName(element.type)}
                        onChange={(e) => {}}
                        onBlur={(e) => handleRename(element.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRename(element.id, e.currentTarget.value);
                          } else if (e.key === 'Escape') {
                            setEditingName(null);
                          }
                        }}
                        className="h-6 text-xs"
                        autoFocus
                      />
                    ) : (
                      <div
                        className="text-xs truncate"
                        onDoubleClick={() => setEditingName(element.id)}
                      >
                        <div className="font-medium">
                          {element.name || getElementTypeName(element.type)}
                        </div>
                        <div className="text-gray-500 truncate">
                          {getElementContent(element).substring(0, 30)}
                          {getElementContent(element).length > 30 && '...'}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        element.hidden ? showElement(element.id) : hideElement(element.id);
                      }}
                      title={element.hidden ? "显示" : "隐藏"}
                    >
                      {element.hidden ? (
                        <EyeOff className="w-3 h-3" />
                      ) : (
                        <Eye className="w-3 h-3" />
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        element.locked ? unlockElement(element.id) : lockElement(element.id);
                      }}
                      title={element.locked ? "解锁" : "锁定"}
                    >
                      {element.locked ? (
                        <Unlock className="w-3 h-3" />
                      ) : (
                        <Lock className="w-3 h-3" />
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteElement(element.id);
                      }}
                      title="删除"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {sortedElements.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  {searchQuery ? '未找到匹配的元素' : '当前幻灯片没有元素'}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* 图层操作 */}
          {activeElementIds.length > 0 && (
            <div className="flex gap-2 border-t pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => activeElementIds.forEach(id => bringToFront(id))}
                title="置于顶层"
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => activeElementIds.forEach(id => bringForward(id))}
                title="上移一层"
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => activeElementIds.forEach(id => sendBackward(id))}
                title="下移一层"
              >
                <ArrowDown className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => activeElementIds.forEach(id => sendToBack(id))}
                title="置于底层"
              >
                <ArrowDown className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* 统计信息 */}
          <div className="text-xs text-gray-500 border-t pt-3">
            共 {elements.length} 个元素
            {activeElementIds.length > 0 && ` • 已选择 ${activeElementIds.length} 个`}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}