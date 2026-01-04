'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePPTStore } from '../store/ppt-store';
import { Button } from '@/components/ui/button';
import { Plus, ZoomIn, ZoomOut } from 'lucide-react';

// 基础画布组件，不包含复杂的拖拽和对齐功能
export function BasicCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasScale, setCanvasScale] = useState(1);
  
  const {
    slides,
    activeSlideIndex,
    activeElementIds,
    addElement,
    selectElements,
  } = usePPTStore();

  const currentSlide = slides[activeSlideIndex];

  // 添加文本元素
  const addTextElement = () => {
    addElement({
      type: 'text',
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      zIndex: 1, // 使用默认值，由addElement自动调整
      text: {
        content: '点击编辑文本',
        fontSize: 16,
        fontFamily: 'Inter, sans-serif',
        color: '#374151',
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
        align: 'left',
        lineHeight: 1.5,
        letterSpacing: 0,
      },
    });
  };

  // 添加形状元素
  const addShapeElement = () => {
    addElement({
      type: 'shape',
      x: 150,
      y: 150,
      width: 100,
      height: 100,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      zIndex: 1, // 使用默认值，由addElement自动调整
      shape: {
        type: 'rectangle',
        fill: '#6366F1',
        stroke: '#4F46E5',
        strokeWidth: 2,
      },
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* 工具栏 */}
      <div className="bg-white border-b border-gray-200 p-3 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCanvasScale(Math.max(0.25, canvasScale - 0.1))}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm min-w-16 text-center">{Math.round(canvasScale * 100)}%</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCanvasScale(Math.min(4, canvasScale + 0.1))}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-gray-300" />

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={addTextElement}
          >
            <Plus className="w-4 h-4 mr-1" />
            文本
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={addShapeElement}
          >
            <Plus className="w-4 h-4 mr-1" />
            形状
          </Button>
        </div>
      </div>

      {/* 画布区域 */}
      <div className="flex-1 overflow-hidden p-8 flex items-center justify-center">
        <div
          ref={canvasRef}
          className="relative border border-gray-300 shadow-lg"
          style={{
            width: 960 * canvasScale,
            height: 540 * canvasScale,
            backgroundColor: currentSlide?.background?.value || '#FFFFFF',
          }}
        >
          {/* 渲染元素 - 按zIndex排序 */}
          {currentSlide?.elements
            .slice() // 创建副本避免修改原数组
            .sort((a, b) => a.zIndex - b.zIndex) // 按zIndex从小到大排序
            .map((element) => (
            <div
              key={element.id}
              className={`
                absolute cursor-pointer border-2 transition-colors
                ${activeElementIds.includes(element.id) 
                  ? 'border-purple-500 bg-purple-50/20' 
                  : 'border-transparent hover:border-purple-300'
                }
              `}
              style={{
                left: element.x * canvasScale,
                top: element.y * canvasScale,
                width: element.width * canvasScale,
                height: element.height * canvasScale,
                transform: `rotate(${element.rotation}deg)`,
                opacity: element.opacity,
                zIndex: element.zIndex,
              }}
              onClick={() => selectElements([element.id])}
            >
              {/* 简化的元素渲染 */}
              {element.type === 'text' && (
                <div 
                  className="w-full h-full flex items-center justify-center p-2 text-sm"
                  style={{
                    color: element.text?.color || '#374151',
                    fontSize: `${(element.text?.fontSize || 16) * canvasScale}px`,
                    fontWeight: element.text?.bold ? 'bold' : 'normal',
                    textAlign: element.text?.align || 'left',
                    // 为包含换行符的文本添加 pre-line 样式
                    whiteSpace: (element.text?.content || '').includes('\n') ? 'pre-line' : 'normal',
                  }}
                >
                  {element.text?.content || '文本'}
                </div>
              )}
              
              {element.type === 'shape' && (
                element.shape?.path ? (
                  // 自定义SVG形状
                  <div 
                    className="w-full h-full"
                    style={{
                      backgroundImage: element.shape?.fill && element.shape.fill.startsWith('data:image/') 
                        ? `url(${element.shape.fill})` 
                        : undefined,
                      backgroundSize: element.shape?.fill && element.shape.fill.startsWith('data:image/') ? 'cover' : undefined,
                      backgroundPosition: element.shape?.fill && element.shape.fill.startsWith('data:image/') ? 'center' : undefined,
                      backgroundRepeat: element.shape?.fill && element.shape.fill.startsWith('data:image/') ? 'no-repeat' : undefined,
                      borderRadius: element.shape?.type === 'circle' ? '50%' : `${(element.shape?.borderRadius || 8) * canvasScale}px`,
                      overflow: 'hidden',
                    }}
                  >
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <path
                        d={element.shape.path}
                        fill={element.shape?.fill && element.shape.fill.startsWith('data:image/') ? 'none' : (element.shape?.fill || '#6366F1')}
                        stroke={element.shape?.stroke || 'transparent'}
                        strokeWidth={element.shape?.strokeWidth || 0}
                        transform={`scale(${element.shape?.isFlipH ? -1 : 1}, ${element.shape?.isFlipV ? -1 : 1})`}
                      />
                    </svg>
                  </div>
                ) : (
                  // 普通形状
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundColor: element.shape?.fill && element.shape.fill.startsWith('data:image/') 
                        ? 'transparent' 
                        : (element.shape?.fill || '#6366F1'),
                      backgroundImage: element.shape?.fill && element.shape.fill.startsWith('data:image/') 
                        ? `url(${element.shape.fill})` 
                        : undefined,
                      backgroundSize: element.shape?.fill && element.shape.fill.startsWith('data:image/') ? 'cover' : undefined,
                      backgroundPosition: element.shape?.fill && element.shape.fill.startsWith('data:image/') ? 'center' : undefined,
                      backgroundRepeat: element.shape?.fill && element.shape.fill.startsWith('data:image/') ? 'no-repeat' : undefined,
                      border: `${element.shape?.strokeWidth || 0}px solid ${element.shape?.stroke || 'transparent'}`,
                      borderRadius: element.shape?.type === 'circle' ? '50%' : `${(element.shape?.borderRadius || 8) * canvasScale}px`,
                      boxShadow: element.shape?.shadow ? 
                        `${element.shape.shadow.h * canvasScale}px ${element.shape.shadow.v * canvasScale}px ${element.shape.shadow.blur * canvasScale}px ${element.shape.shadow.color}` : 
                        'none',
                      transform: `scale(${element.shape?.isFlipH ? -1 : 1}, ${element.shape?.isFlipV ? -1 : 1})`,
                    }}
                  />
                )
              )}
            </div>
          ))}

          {/* 画布信息 */}
          {currentSlide?.elements.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="text-4xl mb-2">📄</div>
                <div className="text-sm">空白幻灯片</div>
                <div className="text-xs mt-1">使用上方工具栏添加内容</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}