'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Copy, 
  Trash2, 
  Eye,
  EyeOff,
  GripVertical 
} from 'lucide-react';
import { usePPTStore, PPTSlide } from '../store/ppt-store';
import { cn } from '@/lib/utils';

interface SortableSlideProps {
  slide: PPTSlide;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function SortableSlide({ slide, index, isActive, onSelect, onDuplicate, onDelete }: SortableSlideProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  const { addSlide } = usePPTStore();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isActive) {
      e.preventDefault();
      // 在当前幻灯片后创建新幻灯片
      addSlide();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group mb-3",
        isDragging && "opacity-50"
      )}
    >
      <div 
        className={cn(
          "relative cursor-pointer rounded-md overflow-hidden transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl",
          isActive 
            ? "ring-2 ring-purple-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/30 dark:to-gray-800/90 shadow-purple-200/50" 
            : "border border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 bg-white dark:bg-gray-800 hover:bg-gradient-to-br hover:from-gray-50 hover:to-white dark:hover:from-gray-700 dark:hover:to-gray-800"
        )}
        onClick={onSelect}
        onKeyDown={handleKeyDown}
        tabIndex={isActive ? 0 : -1}
      >
        {/* 拖拽手柄 */}
        <div 
          {...attributes}
          {...listeners}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200"
        >
          <div className="p-1.5 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-600/50 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800">
            <GripVertical className="w-3 h-3 text-gray-500 dark:text-gray-400" />
          </div>
        </div>

        {/* 幻灯片编号 */}
        <div className="absolute top-3 left-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs px-2 py-1 rounded-full shadow-lg z-10 font-medium">
          {index + 1}
        </div>

        {/* 激活状态指示器 */}
        {isActive && (
          <div className="absolute top-3 right-3 w-2 h-2 bg-green-500 rounded-full shadow-lg z-10 animate-pulse"></div>
        )}

        {/* 操作菜单 */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0 bg-white/90 dark:bg-gray-800/90 shadow-lg border border-gray-200/50 dark:border-gray-600/50 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 rounded-lg"
              >
                <MoreHorizontal className="w-3 h-3 text-gray-600 dark:text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 p-1 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200 dark:border-gray-600">
              <DropdownMenuItem 
                onClick={onDuplicate}
                className="rounded-lg h-8 px-2 hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                <Copy className="w-3 h-3 mr-2 text-green-500" />
                <span className="text-sm">复制</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={onDelete} 
                className="rounded-lg h-8 px-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus:text-red-600"
                disabled={index === 0} // 防止删除第一张幻灯片
              >
                <Trash2 className="w-3 h-3 mr-2" />
                <span className="text-sm">删除</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 幻灯片预览 */}
        <div className="aspect-[16/9] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-3">
          <div 
            className="w-full h-full rounded-lg shadow-inner border border-gray-200/50 dark:border-gray-600/50 relative overflow-hidden"
            style={{ 
              backgroundColor: slide.background?.type === 'color' ? slide.background.value : '#FFFFFF',
              background: slide.background?.type === 'gradient' ? slide.background.value : 
                         slide.background?.type === 'image' ? `url(${slide.background.value})` : undefined,
              backgroundSize: slide.background?.type === 'image' ? (slide.background.imageSize || 'cover') : undefined,
              backgroundPosition: slide.background?.type === 'image' ? 'center' : undefined,
              backgroundRepeat: slide.background?.type === 'image' && slide.background.imageSize === 'repeat' ? 'repeat' : 'no-repeat',
              opacity: slide.background?.type === 'image' && slide.background.opacity !== undefined ? 
                      slide.background.opacity : 1,
            }}
          >
            {/* 渲染元素预览 - 按zIndex排序 */}
            {slide.elements
              ?.slice() // 创建副本避免修改原数组
              .sort((a, b) => a.zIndex - b.zIndex) // 按zIndex从小到大排序
              .map((element) => (
                <div
                  key={element.id}
                  className="absolute"
                  style={{
                    left: `${(element.x / 960) * 100}%`,
                    top: `${(element.y / 540) * 100}%`,
                    width: `${(element.width / 960) * 100}%`,
                    height: `${(element.height / 540) * 100}%`,
                    transform: `rotate(${element.rotation}deg)`,
                    opacity: element.opacity,
                    zIndex: element.zIndex,
                  }}
                >
                  {/* 根据元素类型渲染不同内容 */}
                {element.type === 'text' && (
                  <div 
                    className="w-full h-full flex items-center justify-center text-xs overflow-hidden"
                    style={{ 
                      color: element.text?.color || '#000',
                      fontWeight: element.text?.bold ? 'bold' : 'normal',
                      fontStyle: element.text?.italic ? 'italic' : 'normal',
                      textAlign: element.text?.align || 'left',
                      fontSize: `${Math.max(6, (element.text?.fontSize || 16) * 0.3)}px`,
                      // 为包含换行符的文本添加 pre-line 样式
                      whiteSpace: (element.text?.content || '').includes('\n') ? 'pre-line' : 'normal',
                    }}
                  >
                    {element.text?.content || '文本'}
                  </div>
                )}
                
                {element.type === 'shape' && (
                  <div 
                    className="w-full h-full"
                    style={{ 
                      backgroundColor: (() => {
                        if (element.shape?.fill === 'transparent') return 'transparent';
                        if (element.shape?.fill && element.shape.fill.startsWith('data:image/')) return 'transparent';
                        return element.shape?.fill || '#6366F1';
                      })(),
                      backgroundImage: element.shape?.fill && element.shape.fill.startsWith('data:image/') 
                        ? `url(${element.shape.fill})` 
                        : undefined,
                      backgroundSize: element.shape?.fill && element.shape.fill.startsWith('data:image/') ? 'cover' : undefined,
                      backgroundPosition: element.shape?.fill && element.shape.fill.startsWith('data:image/') ? 'center' : undefined,
                      backgroundRepeat: element.shape?.fill && element.shape.fill.startsWith('data:image/') ? 'no-repeat' : undefined,
                      borderRadius: element.shape?.type === 'circle' ? '50%' : `${element.shape?.borderRadius || 2}px`,
                      border: element.shape?.strokeWidth && element.shape?.stroke !== 'transparent' 
                        ? `${element.shape.strokeWidth}px solid ${element.shape.stroke}` 
                        : 'none',
                    }}
                  >
                    {/* 如果有文本内容，显示在shape中 */}
                    {element.shape?.text?.content && (
                      <div 
                        className="w-full h-full flex items-center justify-center text-xs overflow-hidden"
                        style={{
                          color: element.shape.text.color || '#000',
                          fontWeight: element.shape.text.bold ? 'bold' : 'normal',
                          fontStyle: element.shape.text.italic ? 'italic' : 'normal',
                          textAlign: element.shape.text.align || 'center',
                          fontSize: `${Math.max(6, (element.shape.text.fontSize || 16) * 0.3)}px`,
                        }}
                      >
                        {element.shape.text.content}
                      </div>
                    )}
                  </div>
                )}
                
                {element.type === 'image' && (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                    {element.image?.src ? (
                      <img 
                        src={element.image.src} 
                        alt={element.image.alt || '图片'} 
                        className="w-full h-full object-cover"
                        style={{
                          borderRadius: `${Math.max(1, (element.image.borderRadius || 0) * 0.3)}px`,
                          filter: element.image.filters ? `
                            blur(${(element.image.filters.blur || 0) * 0.5}px)
                            brightness(${element.image.filters.brightness || 100}%)
                            contrast(${element.image.filters.contrast || 100}%)
                            grayscale(${element.image.filters.grayscale || 0}%)
                            saturate(${element.image.filters.saturate || 100}%)
                            hue-rotate(${element.image.filters.hue || 0}deg)
                          `.trim() : 'none',
                        }}
                      />
                    ) : (
                      <div className="text-xs text-gray-400">📷</div>
                    )}
                  </div>
                )}
                
                {/* 其他元素类型的简化预览 */}
                {element.type === 'chart' && (
                  <div className="w-full h-full bg-purple-100 dark:bg-purple-800/20 rounded flex items-center justify-center">
                    {element.chart && element.chart.data && Array.isArray(element.chart.data) ? (
                      <div className="text-xs text-purple-600 flex flex-col items-center">
                        <div className="text-base mb-1">📊</div>
                        <div className="text-xs opacity-75">{element.chart.type}</div>
                        <div className="text-xs opacity-50 mt-1">
                          {element.chart.data[0]?.values ? element.chart.data[0].values.length : element.chart.data.length}项
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-purple-600">📊</div>
                    )}
                  </div>
                )}
                
                {element.type === 'table' && (
                  <div className="w-full h-full bg-blue-100 dark:bg-blue-800/20 rounded flex items-center justify-center">
                    <div className="text-xs text-blue-600">📋</div>
                  </div>
                )}
                
                {element.type === 'video' && (
                  <div className="w-full h-full bg-red-100 dark:bg-red-800/20 rounded flex items-center justify-center">
                    <div className="text-xs text-red-600">🎥</div>
                  </div>
                  )}
                  
                  {element.type === 'audio' && (
                    <div className="w-full h-full bg-green-100 dark:bg-green-800/20 rounded flex items-center justify-center">
                      <div className="text-xs text-green-600">🎵</div>
                    </div>
                  )}
                </div>
              ))
            }
          </div>
        </div>

        {/* 幻灯片标题 */}
        <div className="p-3 bg-gradient-to-r from-gray-50/80 to-white/80 dark:from-gray-700/80 dark:to-gray-800/80 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-600/50">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                {slide.title || `幻灯片 ${index + 1}`}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {slide.elements?.length || 0} 个元素
              </p>
            </div>
            {slide.elements && slide.elements.length > 0 && (
              <div className="flex items-center gap-1">
                {slide.elements.slice(0, 3).map((element, idx) => (
                  <div 
                    key={idx}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: element.type === 'text' ? '#3B82F6' : 
                                     element.type === 'image' ? '#10B981' : 
                                     element.type === 'shape' ? '#8B5CF6' : '#6B7280'
                    }}
                  />
                ))}
                {slide.elements.length > 3 && (
                  <span className="text-xs text-gray-400 ml-1">+{slide.elements.length - 3}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SlideSorter() {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const {
    slides,
    activeSlideIndex,
    addSlide,
    duplicateSlide,
    deleteSlide,
    moveSlide,
    setActiveSlide,
  } = usePPTStore();

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      const oldIndex = slides.findIndex(slide => slide.id === active.id);
      const newIndex = slides.findIndex(slide => slide.id === over?.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        moveSlide(oldIndex, newIndex);
      }
    }
    
    setActiveId(null);
  };

  const draggedSlide = slides.find(slide => slide.id === activeId);

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <SortableContext items={slides.map(slide => slide.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {slides.map((slide, index) => (
            <SortableSlide
              key={slide.id}
              slide={slide}
              index={index}
              isActive={index === activeSlideIndex}
              onSelect={() => {
                setActiveSlide(index)
                console.log('当前激活的幻灯片', slide)
              }}
              onDuplicate={() => duplicateSlide(index)}
              onDelete={() => deleteSlide(index)}
            />
          ))}
        </div>
      </SortableContext>
      
      <DragOverlay>
        {draggedSlide && (
          <div className="border-2 border-purple-500 rounded-lg overflow-hidden shadow-lg">
            <div className="aspect-[16/9] bg-white dark:bg-gray-800 p-2">
              <div 
                className="w-full h-full rounded border border-gray-200 dark:border-gray-600"
                style={{ 
                  backgroundColor: draggedSlide.background?.type === 'color' ? draggedSlide.background.value : '#FFFFFF',
                  background: draggedSlide.background?.type === 'gradient' ? draggedSlide.background.value : 
                             draggedSlide.background?.type === 'image' ? `url(${draggedSlide.background.value})` : undefined,
                  backgroundSize: draggedSlide.background?.type === 'image' ? (draggedSlide.background.imageSize || 'cover') : undefined,
                  backgroundPosition: draggedSlide.background?.type === 'image' ? 'center' : undefined,
                  backgroundRepeat: 'no-repeat',
                  opacity: draggedSlide.background?.type === 'image' && draggedSlide.background.opacity !== undefined ? 
                          draggedSlide.background.opacity : 1,
                }}
              />
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}