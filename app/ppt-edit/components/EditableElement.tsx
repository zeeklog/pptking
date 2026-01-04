'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { usePPTStore, PPTElement } from '../store/ppt-store';
import { ElementContextMenu } from './ContextMenu';
import { ChartRenderer } from './ChartRenderer';
import { TableRenderer } from './TableRenderer';
import { cn } from '@/lib/utils';
import { getPPTElementZIndex } from '../constants/z-index';
import { getCanvasDimensions } from '../constants/canvas';

interface EditableElementProps {
  element: PPTElement;
  isSelected: boolean;
  canvasScale: number;
  onDragStart?: (element: PPTElement) => void;
  onDragEnd?: () => void;
}

// 通用元素内容渲染函数 - 支持递归渲染所有元素类型
function renderUniversalElementContent(element: any, canvasScale: number, isEditingThis?: boolean, updateElement?: any, tempState?: { width: number; height: number } | null): React.ReactNode {
  switch (element.type) {
    case 'text':
      return (
        <div
          className={cn(
            "w-full h-full flex items-center justify-center p-2 text-sm",
            isEditingThis && "outline-none"
          )}
          contentEditable={isEditingThis}
          suppressContentEditableWarning
          style={{
            color: element.text?.color || '#374151',
            fontSize: `${Math.max((element.text?.fontSize || 16) * canvasScale, 10)}px`,
            fontWeight: element.text?.bold ? 'bold' : 'normal',
            fontStyle: element.text?.italic ? 'italic' : 'normal',
            textDecoration: `${element.text?.underline ? 'underline' : ''} ${element.text?.strikethrough ? 'line-through' : ''}`.trim() || 'none',
            textAlign: element.text?.align || 'left',
            lineHeight: element.text?.lineHeight || 1.5,
            letterSpacing: `${element.text?.letterSpacing || 0}px`,
          }}
          onBlur={(e) => {
            if (isEditingThis && updateElement) {
              updateElement(element.id, {
                text: {
                  ...element.text!,
                  content: e.currentTarget.textContent || '',
                },
              });
            }
          }}
          dangerouslySetInnerHTML={{
            __html: element.content || element.text?.content || '请输入文本'
          }}
        />
      );

      case 'shape':
        // 检查是否是路径形状（包含path属性）
        if (element.shape?.path && element.shape?.isPathShape) {
          // 使用临时状态或元素状态的尺寸
          const currentWidth = tempState?.width ?? element.width;
          const currentHeight = tempState?.height ?? element.height;
          
          // 计算缩放比例（相对于原始尺寸）
          const originalWidth = element.width;
          const originalHeight = element.height;
          const scaleX = currentWidth / originalWidth;
          const scaleY = currentHeight / originalHeight;
          
          return (
            <div 
              className="w-full h-full relative"
              style={{
                backgroundImage: element.shape?.fill && element.shape.fill.startsWith('data:image/') 
                  ? `url(${element.shape.fill})` 
                  : undefined,
                backgroundSize: element.shape?.fill && element.shape.fill.startsWith('data:image/') ? 'cover' : undefined,
                backgroundPosition: element.shape?.fill && element.shape.fill.startsWith('data:image/') ? 'center' : undefined,
                backgroundRepeat: element.shape?.fill && element.shape.fill.startsWith('data:image/') ? 'no-repeat' : undefined,
                borderRadius: element.shapType === 'circle' || element.shape?.type === 'circle' ? '50%' : `${element.shape?.borderRadius || 4}px`,
                overflow: 'hidden', // 确保圆形裁剪正确
              }}
            >
              <svg className="w-full h-full" viewBox={`0 0 ${currentWidth} ${currentHeight}`}>
                <path
                  d={element.shape.path}
                  fill={(() => {
                    if (element.shape?.fill === 'transparent') return 'none';
                    // 如果是base64图片数据，SVG path无法直接使用，这里设置为颜色或none
                    if (element.shape?.fill && element.shape.fill.startsWith('data:image/')) {
                      return 'none'; // SVG path无法使用base64图片，让外层div处理
                    }
                    return element.shape?.fill || 'none';
                  })()}
                  stroke={element.shape?.stroke || element.borderColor || 'transparent'}
                  strokeWidth={element.shape?.strokeWidth || element.borderWidth || 0}
                  strokeDasharray={element.borderStrokeDasharray !== "0" ? element.borderStrokeDasharray : undefined}
                  transform={`scale(${scaleX}, ${scaleY})`}
                />
              </svg>
              
              {/* 如果形状包含文本内容，叠加在SVG之上 */}
              {element.content && (
                <div 
                  className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
                  style={{
                    textAlign: element.vAlign === 'mid' ? 'center' : 'left',
                    alignItems: element.vAlign === 'mid' ? 'center' : 'flex-start',
                  }}
                  dangerouslySetInnerHTML={{
                    __html: element.content
                  }}
                />
              )}
              
              {/* 如果形状有shape.text属性 */}
              {element.shape?.text && (
                <div 
                  className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
                  style={{
                    color: element.shape.text.color,
                    fontSize: `${Math.max(element.shape.text.fontSize * canvasScale, 10)}px`,
                    fontFamily: element.shape.text.fontFamily,
                    fontWeight: element.shape.text.bold ? 'bold' : 'normal',
                    fontStyle: element.shape.text.italic ? 'italic' : 'normal',
                    textAlign: element.shape.text.align,
                    lineHeight: element.shape.text.lineHeight,
                  }}
                >
                  {element.shape.text.content}
                </div>
              )}
            </div>
          );
        }
        
        // 普通形状的渲染逻辑
        return (
          <div
            className="w-full h-full"
            style={{
              backgroundColor: (() => {
                // 如果element.fill是颜色类型，使用其值
                if (element.fill?.type === 'color') {
                  return element.fill.value;
                }
                // 如果shape.fill是base64图片数据，返回transparent让backgroundImage处理
                if (element.shape?.fill && element.shape.fill.startsWith('data:image/')) {
                  return 'transparent';
                }
                // 其他情况使用原有逻辑
                return element.shape?.fill || element.fill || 'transparent';
              })(),
              backgroundImage: (() => {
                // 渐变优先
                if (element.shape?.gradient) {
                  return `${element.shape.gradient.type}-gradient(${element.shape.gradient.angle}deg, ${element.shape.gradient.colors.join(', ')})`;
                }
                // 如果shape.fill是base64图片数据，设置为backgroundImage
                if (element.shape?.fill && element.shape.fill.startsWith('data:image/')) {
                  return `url(${element.shape.fill})`;
                }
                return undefined;
              })(),
              backgroundSize: element.shape?.fill && element.shape.fill.startsWith('data:image/') ? 'cover' : undefined,
              backgroundPosition: element.shape?.fill && element.shape.fill.startsWith('data:image/') ? 'center' : undefined,
              backgroundRepeat: element.shape?.fill && element.shape.fill.startsWith('data:image/') ? 'no-repeat' : undefined,
              border: `${element.borderWidth || element.shape?.strokeWidth || 0}px ${element.borderType || 'solid'} ${element.borderColor || element.shape?.stroke || 'transparent'}`,
              borderRadius: element.shapType === 'circle' || element.shape?.type === 'circle' ? '50%' : `${element.shape?.borderRadius || 4}px`,
            }}
          >
            {/* 如果形状包含文本内容 */}
            {element.content && (
              <div 
                className="w-full h-full flex items-center justify-center overflow-hidden"
                style={{
                  textAlign: element.vAlign === 'mid' ? 'center' : 'left',
                  alignItems: element.vAlign === 'mid' ? 'center' : 'flex-start',
                }}
                dangerouslySetInnerHTML={{
                  __html: element.content
                }}
              />
            )}
            {/* 如果形状有shape.text属性 */}
            {element.shape?.text && (
              <div 
                className="w-full h-full flex items-center justify-center overflow-hidden"
                style={{
                  color: element.shape.text.color,
                  fontSize: `${Math.max(element.shape.text.fontSize * canvasScale, 10)}px`,
                  fontFamily: element.shape.text.fontFamily,
                  fontWeight: element.shape.text.bold ? 'bold' : 'normal',
                  fontStyle: element.shape.text.italic ? 'italic' : 'normal',
                  textAlign: element.shape.text.align,
                  lineHeight: element.shape.text.lineHeight,
                }}
              >
                {element.shape.text.content}
              </div>
            )}
          </div>
        );

    case 'image':
      return (
        <div className="w-full h-full bg-[transparent] rounded flex items-center justify-center">
          {element.image?.src ? (
            <img
              src={element.image.src}
              alt={element.image.alt || ''}
              className="w-full h-full object-cover"
              style={{
                borderRadius: `${element.image.borderRadius || 0}px`,
                filter: element.image.filters ? `
                  blur(${element.image.filters.blur || 0}px)
                  brightness(${element.image.filters.brightness || 100}%)
                  contrast(${element.image.filters.contrast || 100}%)
                  grayscale(${element.image.filters.grayscale || 0}%)
                  saturate(${element.image.filters.saturate || 100}%)
                  hue-rotate(${element.image.filters.hue || 0}deg)
                ` : 'none',
              }}
            />
          ) : (
            <div className="text-center text-gray-400 dark:text-gray-500">
              <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                📷
              </div>
              <div className="text-xs">双击添加图片</div>
            </div>
          )}
        </div>
      );

    case 'line':
      return (
        <svg className="w-full h-full">
          {element.line?.points ? (
            <polyline
              points={element.line.points.map((p: any) => `${p.x},${p.y}`).join(' ')}
              stroke={element.line.stroke || '#374151'}
              strokeWidth={element.line.strokeWidth || 2}
              strokeDasharray={element.line.strokeDasharray}
              fill="none"
            />
          ) : (
            <line
              x1="0"
              y1="50%"
              x2="100%"
              y2="50%"
              stroke={element.line?.stroke || '#374151'}
              strokeWidth={element.line?.strokeWidth || 2}
              strokeDasharray={element.line?.strokeDasharray}
            />
          )}
        </svg>
      );

    case 'chart':
      return (
        <div className="w-full h-full bg-white dark:bg-gray-800 rounded border">
          {element.chart ? (
            <ChartRenderer 
              element={element}
              canvasScale={canvasScale}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-blue-600 dark:text-blue-400">
                <div className="text-2xl mb-2">📊</div>
                <div className="text-xs">双击编辑图表</div>
              </div>
            </div>
          )}
        </div>
      );

    case 'table':
      return (
        <TableRenderer
          element={element}
          canvasScale={canvasScale}
        />
      );

    case 'latex':
      return (
        <div className="w-full h-full bg-green-50 dark:bg-green-900/20 rounded flex items-center justify-center p-2">
          {element.latex?.formula ? (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                color: element.latex.color || '#059669',
                fontSize: `${(element.latex.size || 16) * canvasScale}px`,
              }}
            >
              <div className="font-mono text-xs bg-white dark:bg-gray-800 p-1 rounded border">
                {element.latex.formula}
              </div>
            </div>
          ) : (
            <div className="text-center text-green-600 dark:text-green-400">
              <div className="text-lg">∑</div>
              <div className="text-xs">双击编辑公式</div>
            </div>
          )}
        </div>
      );

    case 'video':
      return (
        <div className="w-full h-full bg-black rounded overflow-hidden">
          {element.media?.src ? (
            <video
              src={element.media.src}
              poster={element.media.poster}
              controls={element.media.controls !== false}
              autoPlay={element.media.autoplay}
              loop={element.media.loop}
              muted
              className="w-full h-full object-cover"
              style={{
                opacity: element.opacity,
              }}
            />
          ) : (
            <div className="w-full h-full bg-red-50 dark:bg-red-900/20 rounded flex items-center justify-center">
              <div className="text-center text-red-600 dark:text-red-400">
                <div className="w-8 h-8 mx-auto mb-1">🎥</div>
                <div className="text-xs">双击添加视频</div>
              </div>
            </div>
          )}
        </div>
      );

    case 'audio':
      return (
        <div className="w-full h-full bg-green-50 dark:bg-green-900/20 rounded flex items-center justify-center">
          {element.media?.src ? (
            <div className="text-center">
              <audio
                src={element.media.src}
                controls={element.media.controls !== false}
                autoPlay={element.media.autoplay}
                loop={element.media.loop}
                className="w-full max-w-xs"
              />
            </div>
          ) : (
            <div className="text-center text-green-600 dark:text-green-400">
              <div className="w-8 h-8 mx-auto mb-1">🎵</div>
              <div className="text-xs">双击添加音频</div>
            </div>
          )}
        </div>
      );

    case 'group':
      // 递归渲染group中的所有元素
      const groupElements = element.elements || element.groupedElements || [];
      return (
        <div className="w-full h-full relative overflow-hidden">
          {groupElements.map((childElement: any, index: number) => {
            // 计算子元素在组合中的相对位置和大小（百分比）
            const childLeft = childElement.left || childElement.x || 0;
            const childTop = childElement.top || childElement.y || 0;
            const childWidth = childElement.width || 100;
            const childHeight = childElement.height || 100;
            
            const relativeX = (childLeft / element.width) * 100;
            const relativeY = (childTop / element.height) * 100;
            const relativeWidth = (childWidth / element.width) * 100;
            const relativeHeight = (childHeight / element.height) * 100;
            
            return (
              <div
                key={`group-child-${element.id || 'unknown'}-${index}`}
                className="absolute"
                style={{
                  left: `${relativeX}%`,
                  top: `${relativeY}%`,
                  width: `${relativeWidth}%`,
                  height: `${relativeHeight}%`,
                  transform: `rotate(${childElement.rotate || childElement.rotation || 0}deg)`,
                  opacity: childElement.opacity || 1,
                  zIndex: childElement.order || childElement.zIndex || index,
                }}
              >
                {/* 递归渲染子元素 */}
                {renderUniversalElementContent(childElement, canvasScale)}
              </div>
            );
          })}
        </div>
      );

    default:
      return (
        <div className="w-full h-full bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
          <span className="text-xs text-gray-500">未知元素: {element.type}</span>
        </div>
      );
  }
}

export function EditableElement({ element, isSelected, canvasScale, onDragStart, onDragEnd }: EditableElementProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  // 新增：记录缩放开始时的元素状态和鼠标位置
  const [resizeStartState, setResizeStartState] = useState<{
    elementX: number;
    elementY: number;
    elementWidth: number;
    elementHeight: number;
    mouseX: number;
    mouseY: number;
  } | null>(null);
  
  // 性能优化：缩放时的临时状态，避免频繁触发store更新
  const [tempResizeState, setTempResizeState] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  
  // 节流控制
  const lastUpdateTime = useRef<number>(0);
  const isResizingRef = useRef<boolean>(false);
  const animationFrameRef = useRef<number | null>(null);
  const pendingUpdateRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  const {
    updateElement,
    updateElementBatch,
    selectElements,
    startEditing,
    stopEditing,
    isEditing,
    editingElementId,
    slides,
    activeSlideIndex,
  } = usePPTStore();

  const isEditingThis = isEditing && editingElementId === element.id;

  // 处理元素点击
  const handleElementClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // 打印元素原始数据
    console.log('=== 元素点击调试信息 ===');
    console.log('元素ID:', element.id);
    console.log('元素类型:', element.type);
    console.log('元素名称:', element.name);
    console.log('元素原始数据:', JSON.parse(JSON.stringify(element)));
    
    if (element.shape?.path) {
      console.log('SVG路径数据:', element.shape.path);
      console.log('是否为路径形状:', element.shape.isPathShape);
    }
    
    console.log('当前尺寸:', {
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      rotation: element.rotation
    });
    
    if (tempResizeState) {
      console.log('临时缩放状态:', tempResizeState);
    }
    
    console.log('=== 调试信息结束 ===');
    
    if (!isSelected) {
      selectElements([element.id]);
    }
  };

  // 处理元素双击
  const handleElementDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (element.type === 'text') {
      startEditing(element.id);
    } else if (element.type === 'shape') {
      // 启用shape文本编辑模式
      startEditing(element.id);
    } else if (element.type === 'table') {
      startEditing(element.id); // 表格也使用编辑模式
    } else if (element.type === 'latex') {
      // 打开LaTeX编辑器
      const formula = prompt('编辑LaTeX公式:', element.latex?.formula || '');
      if (formula !== null) {
        updateElement(element.id, {
          latex: {
            ...element.latex,
            formula,
          },
        });
      }
    } else if (element.type === 'image' && !element.image?.src) {
      // 如果是空图片，打开文件选择器
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            updateElement(element.id, {
              image: {
                src: result,
                alt: file.name,
                filters: {
                  blur: 0,
                  brightness: 100,
                  contrast: 100,
                  grayscale: 0,
                  saturate: 100,
                  hue: 0,
                },
                borderRadius: 0,
              },
            });
          };
          reader.readAsDataURL(file);
        }
      };
      fileInput.click();
    } else if (element.type === 'chart') {
      // 打开图表编辑器
      window.dispatchEvent(new CustomEvent('openChartEditor', {
        detail: { elementId: element.id }
      }));
    } else if (element.type === 'video' && !element.media?.src) {
      // 添加视频文件
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'video/*';
      fileInput.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const url = URL.createObjectURL(file);
          updateElement(element.id, {
            media: {
              src: url,
              autoplay: false,
              loop: false,
              controls: true,
            },
          });
        }
      };
      fileInput.click();
    } else if (element.type === 'audio' && !element.media?.src) {
      // 添加音频文件
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'audio/*';
      fileInput.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const url = URL.createObjectURL(file);
          updateElement(element.id, {
            media: {
              src: url,
              autoplay: false,
              loop: false,
              controls: true,
            },
          });
        }
      };
      fileInput.click();
    }
  };

  // 磁性吸附函数
  const applyMagneticSnap = (newX: number, newY: number): { x: number; y: number } => {
    const currentSlide = slides[activeSlideIndex];
    if (!currentSlide) return { x: newX, y: newY };

    const tolerance = 5; // 吸附容差
    let snappedX = newX;
    let snappedY = newY;

    // 画布边界吸附
    const canvasSnapPoints = [0, 480, 960]; // 左、中、右
    const canvasSnapPointsY = [0, 270, 540]; // 上、中、下

    // X轴吸附
    for (const snapPoint of canvasSnapPoints) {
      if (Math.abs(newX - snapPoint) < tolerance) snappedX = snapPoint;
      if (Math.abs(newX + element.width - snapPoint) < tolerance) snappedX = snapPoint - element.width;
      if (Math.abs(newX + element.width / 2 - snapPoint) < tolerance) snappedX = snapPoint - element.width / 2;
    }

    // Y轴吸附
    for (const snapPoint of canvasSnapPointsY) {
      if (Math.abs(newY - snapPoint) < tolerance) snappedY = snapPoint;
      if (Math.abs(newY + element.height - snapPoint) < tolerance) snappedY = snapPoint - element.height;
      if (Math.abs(newY + element.height / 2 - snapPoint) < tolerance) snappedY = snapPoint - element.height / 2;
    }

    // 与其他元素的吸附
    currentSlide.elements.forEach(otherElement => {
      if (otherElement.id === element.id) return;

      // X轴吸附
      if (Math.abs(newX - otherElement.x) < tolerance) snappedX = otherElement.x;
      if (Math.abs(newX - (otherElement.x + otherElement.width)) < tolerance) snappedX = otherElement.x + otherElement.width;
      if (Math.abs(newX + element.width - otherElement.x) < tolerance) snappedX = otherElement.x - element.width;
      if (Math.abs(newX + element.width - (otherElement.x + otherElement.width)) < tolerance) snappedX = otherElement.x + otherElement.width - element.width;

      // 中心对齐
      const otherCenterX = otherElement.x + otherElement.width / 2;
      const elementCenterX = newX + element.width / 2;
      if (Math.abs(elementCenterX - otherCenterX) < tolerance) snappedX = otherCenterX - element.width / 2;

      // Y轴吸附
      if (Math.abs(newY - otherElement.y) < tolerance) snappedY = otherElement.y;
      if (Math.abs(newY - (otherElement.y + otherElement.height)) < tolerance) snappedY = otherElement.y + otherElement.height;
      if (Math.abs(newY + element.height - otherElement.y) < tolerance) snappedY = otherElement.y - element.height;
      if (Math.abs(newY + element.height - (otherElement.y + otherElement.height)) < tolerance) snappedY = otherElement.y + otherElement.height - element.height;

      // 中心对齐
      const otherCenterY = otherElement.y + otherElement.height / 2;
      const elementCenterY = newY + element.height / 2;
      if (Math.abs(elementCenterY - otherCenterY) < tolerance) snappedY = otherCenterY - element.height / 2;
    });

    return { x: snappedX, y: snappedY };
  };

  // 处理拖拽开始
  const handleMouseDown = (e: React.MouseEvent) => {
    if (element.locked) return;
    if (e.button !== 0) return; // 仅左键拖拽
    if (isEditingThis) return; // 编辑模式下不启动拖拽

    e.stopPropagation();
    setIsDragging(true);

    // 获取画布容器的位置信息
    const canvasContainer = document.querySelector('[data-canvas-container]') as HTMLElement;
    const canvasRect = canvasContainer?.getBoundingClientRect();

    if (canvasRect) {
      // 计算相对于画布的鼠标位置
      const canvasMouseX = (e.clientX - canvasRect.left) / canvasScale;
      const canvasMouseY = (e.clientY - canvasRect.top) / canvasScale;

      // 计算鼠标在元素内的偏移量
      setDragStart({
        x: canvasMouseX - element.x,
        y: canvasMouseY - element.y,
      });
    } else {
      // 备用计算方法
      setDragStart({
        x: e.clientX / canvasScale - element.x,
        y: e.clientY / canvasScale - element.y,
      });
    }

    // 通知父组件开始拖拽
    onDragStart?.(element);
  };

  // 处理拖拽
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || element.locked) return;

    // 获取画布容器的位置信息
    const canvasContainer = document.querySelector('[data-canvas-container]') as HTMLElement;
    const canvasRect = canvasContainer?.getBoundingClientRect();

    let rawX, rawY;

    if (canvasRect) {
      // 精确计算相对于画布的新位置
      const canvasMouseX = (e.clientX - canvasRect.left) / canvasScale;
      const canvasMouseY = (e.clientY - canvasRect.top) / canvasScale;

      rawX = canvasMouseX - dragStart.x;
      rawY = canvasMouseY - dragStart.y;
    } else {
      // 备用计算方法
      rawX = (e.clientX / canvasScale) - dragStart.x;
      rawY = (e.clientY / canvasScale) - dragStart.y;
    }

    // 应用磁性吸附
    const snapped = applyMagneticSnap(rawX, rawY);

    // 限制在画布范围内
    const finalX = Math.max(0, Math.min(960 - element.width, snapped.x));
    const finalY = Math.max(0, Math.min(540 - element.height, snapped.y));

    // 拖拽时不创建快照，只在拖拽结束时创建
    updateElement(element.id, { x: finalX, y: finalY }, false);
  }, [isDragging, dragStart, canvasScale, element, updateElement, applyMagneticSnap]);

  // 处理拖拽结束
  // SVG路径缩放函数
  const scaleSVGPath = useCallback((pathData: string, scaleX: number, scaleY: number): string => {
    if (!pathData) return pathData;
    
    console.log('开始缩放路径:', pathData);
    console.log('缩放参数:', { scaleX, scaleY });
    
    // 更精确的SVG路径解析和缩放
    const scaledPath = pathData.replace(/([MLHVCSQTAZ])\s*([\d.\s,-]*)/gi, (match, command, coords) => {
      console.log('匹配到命令:', command, '坐标:', coords);
      
      if (!coords || coords.trim() === '') {
        return command;
      }
      
      // 提取所有数字（包括负数和小数）
      const numbers = coords.match(/-?\d*\.?\d+/g) || [];
      console.log('提取的数字:', numbers);
      
      const scaledNumbers: string[] = [];
      
      // 根据命令类型处理坐标
      switch (command.toUpperCase()) {
        case 'M': // Move to
        case 'L': // Line to
          for (let i = 0; i < numbers.length; i += 2) {
            const x = parseFloat(numbers[i]) || 0;
            const y = parseFloat(numbers[i + 1]) || 0;
            scaledNumbers.push((x * scaleX).toString());
            scaledNumbers.push((y * scaleY).toString());
          }
          break;
        case 'H': // Horizontal line
          for (let i = 0; i < numbers.length; i++) {
            const x = parseFloat(numbers[i]) || 0;
            scaledNumbers.push((x * scaleX).toString());
          }
          break;
        case 'V': // Vertical line
          for (let i = 0; i < numbers.length; i++) {
            const y = parseFloat(numbers[i]) || 0;
            scaledNumbers.push((y * scaleY).toString());
          }
          break;
        case 'Z': // Close path
          return command;
        default:
          // 其他命令，默认按照x,y对处理
          for (let i = 0; i < numbers.length; i += 2) {
            const x = parseFloat(numbers[i]) || 0;
            const y = parseFloat(numbers[i + 1]) || 0;
            scaledNumbers.push((x * scaleX).toString());
            if (i + 1 < numbers.length) {
              scaledNumbers.push((y * scaleY).toString());
            }
          }
          break;
      }
      
      const result = command + ' ' + scaledNumbers.join(' ');
      console.log('命令缩放结果:', result);
      return result;
    });
    
    console.log('最终缩放结果:', scaledPath);
    return scaledPath;
  }, []);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      // 拖拽结束时创建快照
      updateElement(element.id, {}, true);
      // 通知父组件拖拽结束
      onDragEnd?.();
    }
    if (isResizing) {
      isResizingRef.current = false;
      
      // 取消待处理的动画帧
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // 最终状态同步：优先使用临时状态，其次使用待更新状态
      const finalState = tempResizeState || pendingUpdateRef.current;
      if (finalState && resizeStartState) {
        // 计算缩放比例
        const scaleX = finalState.width / resizeStartState.elementWidth;
        const scaleY = finalState.height / resizeStartState.elementHeight;
        
        // 如果是SVG路径形状，需要更新path数据
        if (element.shape?.path && element.shape?.isPathShape) {
          console.log('=== SVG路径缩放调试 ===');
          console.log('元素ID:', element.id);
          console.log('元素名称:', element.name);
          console.log('原始尺寸:', { width: resizeStartState.elementWidth, height: resizeStartState.elementHeight });
          console.log('新尺寸:', { width: finalState.width, height: finalState.height });
          console.log('缩放比例:', { scaleX: scaleX.toFixed(3), scaleY: scaleY.toFixed(3) });
          console.log('缩放前的path:', element.shape.path);
          
          const scaledPath = scaleSVGPath(element.shape.path, scaleX, scaleY);
          console.log('缩放后的path:', scaledPath);
          console.log('=== 缩放调试结束 ===');
          
          // 更新元素，包括尺寸和路径数据
          updateElement(element.id, {
            ...finalState,
            shape: {
              ...element.shape,
              path: scaledPath,
              isPathShape: true // 保持为路径形状
            }
          }, true);
        } else {
          // 非路径形状，只更新尺寸
          updateElement(element.id, finalState, true);
        }
      } else {
        // 没有任何状态时也要创建快照
        updateElement(element.id, {}, true);
      }
      
      setIsResizing(false);
      setResizeHandle(null);
      setResizeStartState(null); // 清除缩放状态
      setTempResizeState(null); // 清除临时状态
      pendingUpdateRef.current = null; // 清除待更新状态
    }
  }, [isDragging, isResizing, element.id, element.shape, updateElement, onDragEnd, tempResizeState, resizeStartState, scaleSVGPath]);

  // 处理缩放手柄
  const handleResizeMouseDown = (e: React.MouseEvent, handle: string) => {
    if (element.locked) return;

    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    
    // 获取画布容器的位置信息
    const canvasContainer = document.querySelector('[data-canvas-container]') as HTMLElement;
    const canvasRect = canvasContainer?.getBoundingClientRect();
    
    if (canvasRect) {
      // 计算相对于画布的鼠标位置（考虑缩放）
      const canvasMouseX = (e.clientX - canvasRect.left) / canvasScale;
      const canvasMouseY = (e.clientY - canvasRect.top) / canvasScale;
      
      // 记录缩放开始时的完整状态
      setResizeStartState({
        elementX: element.x,
        elementY: element.y,
        elementWidth: element.width,
        elementHeight: element.height,
        mouseX: canvasMouseX,
        mouseY: canvasMouseY,
      });
    } else {
      // 备用方法：直接使用屏幕坐标
      setDragStart({ x: e.clientX, y: e.clientY });
      setResizeStartState({
        elementX: element.x,
        elementY: element.y,
        elementWidth: element.width,
        elementHeight: element.height,
        mouseX: e.clientX / canvasScale,
        mouseY: e.clientY / canvasScale,
      });
    }
  };

  // 监听全局鼠标事件
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      handleMouseMove(e);

      if (isResizing && resizeHandle && resizeStartState) {
        isResizingRef.current = true;
        
        // 获取画布容器的位置信息
        const canvasContainer = document.querySelector('[data-canvas-container]') as HTMLElement;
        const canvasRect = canvasContainer?.getBoundingClientRect();
        
        let currentCanvasMouseX, currentCanvasMouseY;
        
        if (canvasRect) {
          // 计算当前鼠标相对于画布的位置
          currentCanvasMouseX = (e.clientX - canvasRect.left) / canvasScale;
          currentCanvasMouseY = (e.clientY - canvasRect.top) / canvasScale;
        } else {
          // 备用方法
          currentCanvasMouseX = e.clientX / canvasScale;
          currentCanvasMouseY = e.clientY / canvasScale;
        }
        
        // 计算鼠标移动的增量（基于画布坐标系）
        const deltaX = currentCanvasMouseX - resizeStartState.mouseX;
        const deltaY = currentCanvasMouseY - resizeStartState.mouseY;
        
        // 检查是否按下Shift键来保持比例
        const keepAspectRatio = e.shiftKey;
        
        // 基于初始状态计算新的尺寸和位置
        let newWidth = resizeStartState.elementWidth;
        let newHeight = resizeStartState.elementHeight;
        let newX = resizeStartState.elementX;
        let newY = resizeStartState.elementY;
        
        // 最小尺寸限制
        const minSize = 20;
        
        switch (resizeHandle) {
          case 'nw': // 左上角
            newWidth = Math.max(minSize, resizeStartState.elementWidth - deltaX);
            newHeight = Math.max(minSize, resizeStartState.elementHeight - deltaY);
            
            // 如果按下Shift键，保持比例
            if (keepAspectRatio) {
              const maxScale = Math.max(
                newWidth / resizeStartState.elementWidth,
                newHeight / resizeStartState.elementHeight
              );
              newWidth = resizeStartState.elementWidth * maxScale;
              newHeight = resizeStartState.elementHeight * maxScale;
            }
            
            newX = resizeStartState.elementX + (resizeStartState.elementWidth - newWidth);
            newY = resizeStartState.elementY + (resizeStartState.elementHeight - newHeight);
            break;
            
          case 'ne': // 右上角
            newWidth = Math.max(minSize, resizeStartState.elementWidth + deltaX);
            newHeight = Math.max(minSize, resizeStartState.elementHeight - deltaY);
            
            // 如果按下Shift键，保持比例
            if (keepAspectRatio) {
              const maxScale = Math.max(
                newWidth / resizeStartState.elementWidth,
                newHeight / resizeStartState.elementHeight
              );
              newWidth = resizeStartState.elementWidth * maxScale;
              newHeight = resizeStartState.elementHeight * maxScale;
            }
            
            newY = resizeStartState.elementY + (resizeStartState.elementHeight - newHeight);
            break;
            
          case 'sw': // 左下角
            newWidth = Math.max(minSize, resizeStartState.elementWidth - deltaX);
            newHeight = Math.max(minSize, resizeStartState.elementHeight + deltaY);
            
            // 如果按下Shift键，保持比例
            if (keepAspectRatio) {
              const maxScale = Math.max(
                newWidth / resizeStartState.elementWidth,
                newHeight / resizeStartState.elementHeight
              );
              newWidth = resizeStartState.elementWidth * maxScale;
              newHeight = resizeStartState.elementHeight * maxScale;
            }
            
            newX = resizeStartState.elementX + (resizeStartState.elementWidth - newWidth);
            break;
            
          case 'se': // 右下角
            newWidth = Math.max(minSize, resizeStartState.elementWidth + deltaX);
            newHeight = Math.max(minSize, resizeStartState.elementHeight + deltaY);
            
            // 如果按下Shift键，保持比例
            if (keepAspectRatio) {
              const maxScale = Math.max(
                newWidth / resizeStartState.elementWidth,
                newHeight / resizeStartState.elementHeight
              );
              newWidth = resizeStartState.elementWidth * maxScale;
              newHeight = resizeStartState.elementHeight * maxScale;
            }
            break;
            
          case 'n': // 上边
            newHeight = Math.max(minSize, resizeStartState.elementHeight - deltaY);
            newY = resizeStartState.elementY + (resizeStartState.elementHeight - newHeight);
            break;
            
          case 's': // 下边
            newHeight = Math.max(minSize, resizeStartState.elementHeight + deltaY);
            break;
            
          case 'w': // 左边
            newWidth = Math.max(minSize, resizeStartState.elementWidth - deltaX);
            newX = resizeStartState.elementX + (resizeStartState.elementWidth - newWidth);
            break;
            
          case 'e': // 右边
            newWidth = Math.max(minSize, resizeStartState.elementWidth + deltaX);
            break;
        }
        
        // 约束在画布范围内
        const canvasSize = getCanvasDimensions();
        const canvasWidth = canvasSize.width;
        const canvasHeight = canvasSize.height;
        
        // 确保元素不超出画布边界
        if (newX < 0) {
          newWidth = Math.max(minSize, newWidth + newX);
          newX = 0;
        }
        if (newY < 0) {
          newHeight = Math.max(minSize, newHeight + newY);
          newY = 0;
        }
        if (newX + newWidth > canvasWidth) {
          newWidth = canvasWidth - newX;
        }
        if (newY + newHeight > canvasHeight) {
          newHeight = canvasHeight - newY;
        }
        
        // 确保最终尺寸不小于最小值
        newWidth = Math.max(minSize, newWidth);
        newHeight = Math.max(minSize, newHeight);
        
        // 性能优化：使用临时状态和requestAnimationFrame
        const newState = { x: newX, y: newY, width: newWidth, height: newHeight };
        
        // 更新临时状态用于即时视觉反馈
        setTempResizeState(newState);
        
        // 存储待更新的状态
        pendingUpdateRef.current = newState;
        
        // 使用requestAnimationFrame进行高性能的store更新
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        
        animationFrameRef.current = requestAnimationFrame(() => {
          if (pendingUpdateRef.current && isResizingRef.current) {
            updateElement(element.id, pendingUpdateRef.current, false);
            pendingUpdateRef.current = null;
          }
          animationFrameRef.current = null;
        });
      }
    };

    const handleGlobalMouseUp = () => {
      handleMouseUp();
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);
  
  // 清理资源
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // 渲染元素内容
  const renderElementContent = () => {
    switch (element.type) {
      case 'text':
        return (
          <div
            className={cn(
              "w-full h-full flex items-center justify-center p-2 text-sm",
              isEditingThis && "outline-none"
            )}
            contentEditable={isEditingThis}
            suppressContentEditableWarning
            style={{
              color: element.text?.color || '#374151',
              fontSize: `${Math.max(element.text?.fontSize * canvasScale, 10)}px`,
              fontWeight: element.text?.bold ? 'bold' : 'normal',
              fontStyle: element.text?.italic ? 'italic' : 'normal',
              textDecoration: `${element.text?.underline ? 'underline' : ''} ${element.text?.strikethrough ? 'line-through' : ''}`.trim() || 'none',
              textAlign: element.text?.align || 'left',
              lineHeight: element.text?.lineHeight || 1.5,
              letterSpacing: `${element.text?.letterSpacing || 0}px`,
              // 为包含换行符的文本添加 pre-line 样式
              whiteSpace: (element.text?.content || '').includes('\n') ? 'pre-line' : 'normal',
            }}
            onBlur={(e) => {
              if (isEditingThis) {
                updateElement(element.id, {
                  text: {
                    ...element.text!,
                    content: e.currentTarget.textContent || '',
                  },
                });
              }
            }}
          >
            {element.text?.content || '请输入文本'}
          </div>
        );

      case 'shape':
        // 如果是组合元素，渲染其包含的子元素
        if (element.isGroup && element.groupedElements) {
          return (
            <div className="w-full h-full relative overflow-hidden">
              {element.groupedElements.map((childElement, index) => {
                // 计算子元素在组合中的相对位置和大小
                const relativeX = (childElement.x / element.width) * 100;
                const relativeY = (childElement.y / element.height) * 100;
                const relativeWidth = (childElement.width / element.width) * 100;
                const relativeHeight = (childElement.height / element.height) * 100;
                return (
                  <div
                    key={`group-child-${index}`}
                    className="absolute"
                    style={{
                      left: `${relativeX}%`,
                      top: `${relativeY}%`,
                      width: `${relativeWidth}%`,
                      height: `${relativeHeight}%`,
                      transform: `rotate(${childElement.rotation}deg)`,
                      opacity: childElement.opacity,
                      zIndex: childElement.zIndex || index,
                    }}
                  >
                    {/* 渲染不同类型的子元素 */}
                    {childElement.type === 'text' && (
                      <div
                        className="w-full h-full flex items-center justify-center overflow-hidden"
                        style={{
                          color: childElement.text?.color || '#374151',
                          fontSize: `${Math.max(childElement.text?.fontSize * canvasScale, 10)}px`,
                          fontFamily: childElement.text?.fontFamily || 'Inter, sans-serif',
                          fontWeight: childElement.text?.bold ? 'bold' : 'normal',
                          fontStyle: childElement.text?.italic ? 'italic' : 'normal',
                          textAlign: childElement.text?.align || 'left',
                          lineHeight: childElement.text?.lineHeight || 1.2,
                          // 为包含换行符的文本添加 pre-line 样式
                          whiteSpace: (childElement.text?.content || '').includes('\n') ? 'pre-line' : 'normal',
                        }}
                      >
                        {childElement.text?.content || '文本'}
                      </div>
                    )}

                    {childElement.type === 'shape' && (
                      childElement.shape?.path ? (
                        // 如果有路径数据，渲染SVG自定义形状  
                        <div className="w-full h-full">
                          <svg className="w-full h-full" viewBox={`0 0 100 100`}>
                            {childElement.shape?.gradient && (
                              <defs>
                                <linearGradient id={`child-gradient-${index}`} gradientTransform={`rotate(${childElement.shape.gradient.rot || childElement.shape.gradient.angle || 0})`}>
                                  {Array.isArray(childElement.shape.gradient.colors) && childElement.shape.gradient.colors[0]?.pos ? 
                                    childElement.shape.gradient.colors.map((colorStop, colorIndex) => (
                                      <stop key={colorIndex} offset={colorStop.pos} stopColor={colorStop.color} />
                                    )) :
                                    (childElement.shape.gradient.colors as unknown as string[]).map((color, colorIndex) => (
                                      <stop key={colorIndex} offset={`${(colorIndex / (childElement.shape.gradient.colors.length - 1)) * 100}%`} stopColor={color} />
                                    ))
                                  }
                                </linearGradient>
                              </defs>
                            )}
                            {childElement.shape?.shadow && (
                              <defs>
                                <filter id={`child-shadow-${index}`} x="-50%" y="-50%" width="200%" height="200%">
                                  <feDropShadow
                                    dx={childElement.shape.shadow.h}
                                    dy={childElement.shape.shadow.v}
                                    stdDeviation={childElement.shape.shadow.blur / 2}
                                    floodColor={childElement.shape.shadow.color}
                                  />
                                </filter>
                              </defs>
                            )}
                            <path
                              d={childElement.shape.path}
                              fill={childElement.shape?.gradient ? `url(#child-gradient-${index})` : 
                                    (childElement.shape?.fill !== 'transparent' ? childElement.shape?.fill || 'none' : 'none')}
                              stroke={childElement.shape?.stroke || 'transparent'}
                              strokeWidth={childElement.shape?.strokeWidth || 0}
                              filter={childElement.shape?.shadow ? `url(#child-shadow-${index})` : undefined}
                              transform={`scale(${childElement.shape?.isFlipH ? -1 : 1}, ${childElement.shape?.isFlipV ? -1 : 1})`}
                            />
                          </svg>
                        </div>
                      ) : (
                        // 普通形状渲染
                        <div
                          className="w-full h-full"
                          style={{
                            backgroundColor: childElement.shape?.gradient ? 'transparent' : (childElement.shape?.fill || 'transparent'),
                            backgroundImage: childElement.shape?.gradient ? (() => {
                              // 处理复杂的渐变格式
                              if (Array.isArray(childElement.shape.gradient.colors) && childElement.shape.gradient.colors[0]?.pos) {
                                const colorStops = childElement.shape.gradient.colors.map(stop => `${stop.color} ${stop.pos}`).join(', ');
                                return `${childElement.shape.gradient.type || 'linear'}-gradient(${childElement.shape.gradient.rot || childElement.shape.gradient.angle || 0}deg, ${colorStops})`;
                              }
                              return `${childElement.shape.gradient.type}-gradient(${childElement.shape.gradient.angle}deg, ${childElement.shape.gradient.colors.join(', ')})`;
                            })() : undefined,
                            border: `${childElement.shape?.strokeWidth || 0}px solid ${childElement.shape?.stroke || 'transparent'}`,
                            borderRadius: childElement.shape?.type === 'circle' ? '50%' : `${childElement.shape?.borderRadius || 4}px`,
                            boxShadow: childElement.shape?.shadow ? 
                              `${childElement.shape.shadow.h}px ${childElement.shape.shadow.v}px ${childElement.shape.shadow.blur}px ${childElement.shape.shadow.color}` : 
                              'none',
                            transform: `scale(${childElement.shape?.isFlipH ? -1 : 1}, ${childElement.shape?.isFlipV ? -1 : 1})`,
                          }}
                        />
                      )
                    )}

                    {childElement.type === 'image' && childElement.image?.src && (
                      <img
                        src={childElement.image.src}
                        alt={childElement.image.alt || ''}
                        className="w-full h-full object-cover"
                        style={{
                          borderRadius: `${childElement.image.borderRadius || 0}px`,
                          filter: childElement.image.filters ? `
                            blur(${childElement.image.filters.blur || 0}px)
                            brightness(${childElement.image.filters.brightness || 100}%)
                            contrast(${childElement.image.filters.contrast || 100}%)
                            grayscale(${childElement.image.filters.grayscale || 0}%)
                            saturate(${childElement.image.filters.saturate || 100}%)
                            hue-rotate(${childElement.image.filters.hue || 0}deg)
                          ` : 'none',
                        }}
                      />
                    )}

                    {childElement.type === 'line' && (
                      <svg className="w-full h-full">
                        <line
                          x1="0"
                          y1="50%"
                          x2="100%"
                          y2="50%"
                          stroke={childElement.line?.stroke || '#374151'}
                          strokeWidth={childElement.line?.strokeWidth || 2}
                          strokeDasharray={childElement.line?.strokeDasharray}
                        />
                      </svg>
                    )}
                  </div>
                );
              })}

              {/* 选中时显示组合边框 */}
              {isSelected && (
                <div className="absolute inset-0 border-2 border-dashed border-purple-400 opacity-60 pointer-events-none" />
              )}

              {/* 组合标识 */}
              {isSelected && (
                <div className="absolute -top-6 -left-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs px-2 py-1 rounded shadow-sm border border-purple-200 dark:border-purple-700">
                  组合 ({element.groupedElements.length})
                </div>
              )}
            </div>
          );
        }
        
        // 检查是否是路径形状（包含path属性）
        if (element.shape?.path && element.shape?.isPathShape) {
          // 使用临时状态或元素状态的尺寸
          const currentWidth = tempResizeState?.width ?? element.width;
          const currentHeight = tempResizeState?.height ?? element.height;
          
          // 计算缩放比例（相对于原始尺寸）
          const originalWidth = element.width;
          const originalHeight = element.height;
          const scaleX = currentWidth / originalWidth;
          const scaleY = currentHeight / originalHeight;
          
          // 构建渐变
          const gradientId = `gradient-${element.id}`;
          const gradientDef = element.shape?.gradient ? (
            <defs>
              <linearGradient id={gradientId} gradientTransform={`rotate(${element.shape.gradient.rot || element.shape.gradient.angle || 0})`}>
                {element.shape.gradient.colors.map((colorStop, index) => (
                  <stop key={index} offset={colorStop.pos} stopColor={colorStop.color} />
                ))}
              </linearGradient>
            </defs>
          ) : null;

          // 构建阴影滤镜
          const shadowId = `shadow-${element.id}`;
          const shadowFilter = element.shape?.shadow ? (
            <defs>
              <filter id={shadowId} x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow
                  dx={element.shape.shadow.h}
                  dy={element.shape.shadow.v}
                  stdDeviation={element.shape.shadow.blur / 2}
                  floodColor={element.shape.shadow.color}
                />
              </filter>
            </defs>
          ) : null;

          // 构建翻转变换
          const flipTransform = `scale(${element.shape?.isFlipH ? -1 : 1}, ${element.shape?.isFlipV ? -1 : 1}) scale(${scaleX}, ${scaleY})`;

          return (
            <div className="w-full h-full relative">
              <svg className="w-full h-full" viewBox={`0 0 ${currentWidth} ${currentHeight}`}>
                {gradientDef}
                {shadowFilter}
                <path
                  d={element.shape.path}
                  fill={element.shape?.gradient ? `url(#${gradientId})` : 
                        (element.shape?.fill !== 'transparent' ? element.shape?.fill || 'none' : 'none')}
                  stroke={element.shape?.stroke || 'transparent'}
                  strokeWidth={element.shape?.strokeWidth || 0}
                  filter={element.shape?.shadow ? `url(#${shadowId})` : undefined}
                  transform={flipTransform}
                />
              </svg>
              
              {/* 如果形状有shape.text属性，叠加在SVG之上 */}
              {element.shape?.text && (
                <div
                  className="absolute inset-0 flex items-center justify-center px-2 py-1 overflow-hidden pointer-events-none"
                  style={{
                    alignItems: element.shape.text.verticalAlign === 'top' ? 'flex-start' :
                               element.shape.text.verticalAlign === 'bottom' ? 'flex-end' : 'center',
                    justifyContent: element.shape.text.align === 'left' ? 'flex-start' :
                                    element.shape.text.align === 'right' ? 'flex-end' : 'center',
                  }}
                >
                  {isEditingThis ? (
                    <textarea
                      value={element.shape.text.content}
                      onChange={(e) => {
                        updateElement(element.id, {
                          shape: {
                            ...element.shape!,
                            text: {
                              ...element.shape!.text!,
                              content: e.target.value,
                            },
                          },
                        });
                      }}
                      onBlur={() => stopEditing()}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          stopEditing();
                        }
                      }}
                      className="w-full h-full bg-transparent border-none outline-none resize-none pointer-events-auto"
                      style={{
                        fontSize: `${Math.max(element.shape.text.fontSize * canvasScale, 10)}px`,
                        fontFamily: element.shape.text.fontFamily,
                        color: element.shape.text.color,
                        fontWeight: element.shape.text.bold ? 'bold' : 'normal',
                        fontStyle: element.shape.text.italic ? 'italic' : 'normal',
                        textDecoration: [
                          element.shape.text.underline && 'underline',
                          element.shape.text.strikethrough && 'line-through'
                        ].filter(Boolean).join(' ') || 'none',
                        lineHeight: element.shape.text.lineHeight,
                        letterSpacing: `${element.shape.text.letterSpacing}px`,
                        textAlign: element.shape.text.align,
                      }}
                      autoFocus
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: `${Math.max(element.shape.text.fontSize * canvasScale, 10)}px`,
                        fontFamily: element.shape.text.fontFamily,
                        color: element.shape.text.color,
                        fontWeight: element.shape.text.bold ? 'bold' : 'normal',
                        fontStyle: element.shape.text.italic ? 'italic' : 'normal',
                        textDecoration: [
                          element.shape.text.underline && 'underline',
                          element.shape.text.strikethrough && 'line-through'
                        ].filter(Boolean).join(' ') || 'none',
                        lineHeight: element.shape.text.lineHeight,
                        letterSpacing: `${element.shape.text.letterSpacing}px`,
                        textAlign: element.shape.text.align,
                        wordBreak: 'break-word',
                        hyphens: 'auto',
                        // 为包含换行符的文本添加 pre-line 样式
                        whiteSpace: (element.shape.text.content || '').includes('\n') ? 'pre-line' : 'normal',
                      }}
                    >
                      {element.shape.text.content}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        }

        // 普通形状的渲染逻辑
        // 构建背景渐变
        const buildGradient = () => {
          if (!element.shape?.gradient) return undefined;
          
          // 处理复杂的渐变格式（PPTX导入的格式）
          if (Array.isArray(element.shape.gradient.colors) && element.shape.gradient.colors[0]?.pos) {
            const colorStops = element.shape.gradient.colors.map(stop => `${stop.color} ${stop.pos}`).join(', ');
            return `${element.shape.gradient.type || 'linear'}-gradient(${element.shape.gradient.rot || element.shape.gradient.angle || 0}deg, ${colorStops})`;
          }
          
          // 处理简单的渐变格式
          return `${element.shape.gradient.type}-gradient(${element.shape.gradient.angle}deg, ${element.shape.gradient.colors.join(', ')})`;
        };

        // 构建阴影样式
        const buildBoxShadow = () => {
          if (!element.shape?.shadow) return 'none';
          return `${element.shape.shadow.h}px ${element.shape.shadow.v}px ${element.shape.shadow.blur}px ${element.shape.shadow.color}`;
        };

        // 构建翻转变换
        const buildTransform = () => {
          const flipX = element.shape?.isFlipH ? -1 : 1;
          const flipY = element.shape?.isFlipV ? -1 : 1;
          return `scale(${flipX}, ${flipY})`;
        };

        return (
          <div
            className="w-full h-full relative flex items-center justify-center"
            style={{
              backgroundColor: element.shape?.gradient ? 'transparent' : (element.shape?.fill || 'transparent'),
              backgroundImage: buildGradient(),
              border: `${element.shape?.strokeWidth || 0}px solid ${element.shape?.stroke || 'transparent'}`,
              borderRadius: element.shape?.type === 'circle' ? '50%' : `${element.shape?.borderRadius || 8}px`,
              boxShadow: buildBoxShadow(),
              transform: buildTransform(),
            }}
          >
            {/* 渲染shape中的文本内容 */}
            {element.shape?.text && (
              <div
                className="w-full h-full flex items-center justify-center px-2 py-1 overflow-hidden"
                style={{
                  alignItems: element.shape.text.verticalAlign === 'top' ? 'flex-start' :
                             element.shape.text.verticalAlign === 'bottom' ? 'flex-end' : 'center',
                  justifyContent: element.shape.text.align === 'left' ? 'flex-start' :
                                  element.shape.text.align === 'right' ? 'flex-end' : 'center',
                }}
              >
                {isEditingThis ? (
                  <textarea
                    value={element.shape.text.content}
                    onChange={(e) => {
                      updateElement(element.id, {
                        shape: {
                          ...element.shape!,
                          text: {
                            ...element.shape!.text!,
                            content: e.target.value,
                          },
                        },
                      });
                    }}
                    onBlur={() => stopEditing()}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        stopEditing();
                      }
                    }}
                    className="w-full h-full bg-transparent border-none outline-none resize-none"
                    style={{
                      fontSize: `${Math.max(element.shape.text.fontSize * canvasScale, 10)}px`,
                      fontFamily: element.shape.text.fontFamily,
                      color: element.shape.text.color,
                      fontWeight: element.shape.text.bold ? 'bold' : 'normal',
                      fontStyle: element.shape.text.italic ? 'italic' : 'normal',
                      textDecoration: [
                        element.shape.text.underline && 'underline',
                        element.shape.text.strikethrough && 'line-through'
                      ].filter(Boolean).join(' ') || 'none',
                      lineHeight: element.shape.text.lineHeight,
                      letterSpacing: `${element.shape.text.letterSpacing}px`,
                      textAlign: element.shape.text.align,
                    }}
                    autoFocus
                  />
                ) : (
                  <span
                    style={{
                      fontSize: `${Math.max(element.shape.text.fontSize * canvasScale, 10)}px`,
                      fontFamily: element.shape.text.fontFamily,
                      color: element.shape.text.color,
                      fontWeight: element.shape.text.bold ? 'bold' : 'normal',
                      fontStyle: element.shape.text.italic ? 'italic' : 'normal',
                      textDecoration: [
                        element.shape.text.underline && 'underline',
                        element.shape.text.strikethrough && 'line-through'
                      ].filter(Boolean).join(' ') || 'none',
                      lineHeight: element.shape.text.lineHeight,
                      letterSpacing: `${element.shape.text.letterSpacing}px`,
                      textAlign: element.shape.text.align,
                      wordBreak: 'break-word',
                      hyphens: 'auto',
                      // 为包含换行符的文本添加 pre-line 样式
                      whiteSpace: (element.shape.text.content || '').includes('\n') ? 'pre-line' : 'normal',
                    }}
                  >
                    {element.shape.text.content}
                  </span>
                )}
              </div>
            )}
          </div>
        );

      case 'image':
        return (
          <div className="w-full h-full bg-[transparent] rounded flex items-center justify-center">
            {element.image?.src ? (
              <img
                src={element.image.src}
                alt={element.image.alt || ''}
                className="w-full h-full object-cover rounded"
                style={{
                  filter: `
                    blur(${element.image.filters?.blur || 0}px)
                    brightness(${element.image.filters?.brightness || 100}%)
                    contrast(${element.image.filters?.contrast || 100}%)
                    grayscale(${element.image.filters?.grayscale || 0}%)
                    saturate(${element.image.filters?.saturate || 100}%)
                    hue-rotate(${element.image.filters?.hue || 0}deg)
                  `,
                  borderRadius: `${element.image.borderRadius || 0}px`,
                }}
              />
            ) : (
              <div className="text-gray-400 text-center">
                <div className="w-8 h-8 mx-auto mb-1 bg-gray-300 dark:bg-gray-500 rounded"></div>
                <div className="text-xs">点击添加图片</div>
              </div>
            )}
          </div>
        );

      case 'line':
        return (
          <svg className="w-full h-full">
            {element.line?.type === 'polyline' && element.line.points ? (
              <polyline
                points={element.line.points.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={element.line.stroke || '#374151'}
                strokeWidth={element.line.strokeWidth || 2}
                strokeDasharray={element.line.strokeDasharray}
                markerStart={element.line.startMarker === 'arrow' ? 'url(#arrowStart)' : undefined}
                markerEnd={element.line.endMarker === 'arrow' ? 'url(#arrowEnd)' : undefined}
              />
            ) : (
              <line
                x1="0"
                y1="50%"
                x2="100%"
                y2="50%"
                stroke={element.line?.stroke || '#374151'}
                strokeWidth={element.line?.strokeWidth || 2}
                strokeDasharray={element.line?.strokeDasharray}
                markerStart={element.line?.startMarker === 'arrow' ? 'url(#arrowStart)' : undefined}
                markerEnd={element.line?.endMarker === 'arrow' ? 'url(#arrowEnd)' : undefined}
              />
            )}

            {/* 箭头标记定义 */}
            <defs>
              <marker
                id="arrowStart"
                markerWidth="10"
                markerHeight="10"
                refX="0"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <polygon points="0,0 0,6 9,3" fill={element.line?.stroke || '#374151'} />
              </marker>
              <marker
                id="arrowEnd"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <polygon points="0,0 0,6 9,3" fill={element.line?.stroke || '#374151'} />
              </marker>
            </defs>
          </svg>
        );

      case 'chart':
        return (
          <div className="w-full h-full bg-white dark:bg-gray-800 rounded border">
            {element.chart ? (
              <ChartRenderer element={element} canvasScale={canvasScale} />
            ) : (
              <div className="w-full h-full bg-purple-50 dark:bg-purple-900/20 rounded flex items-center justify-center">
                <div className="text-center text-purple-600 dark:text-purple-400">
                  <div className="w-8 h-8 mx-auto mb-1">📊</div>
                  <div className="text-xs">双击编辑图表</div>
                </div>
              </div>
            )}
          </div>
        );

      case 'table':
        return (
          <TableRenderer
            element={element}
            canvasScale={canvasScale}
            isEditing={isEditingThis}
            onCellEdit={(row, col, value) => {
              const newData = [...(element.table?.data || [])];
              if (!newData[row]) newData[row] = [];
              newData[row][col] = value;

              updateElement(element.id, {
                table: {
                  ...element.table!,
                  data: newData,
                },
              });
            }}
          />
        );

      case 'latex':
        return (
          <div className="w-full h-full bg-green-50 dark:bg-green-900/20 rounded flex items-center justify-center p-2">
            {element.latex?.formula ? (
              <div
                className="text-center"
                style={{
                  color: element.latex.color || '#059669',
                  fontSize: `${(element.latex.size || 16) * canvasScale}px`,
                }}
              >
                {/* 这里应该渲染LaTeX公式，暂时显示原始公式 */}
                <div className="font-mono text-xs bg-white dark:bg-gray-800 p-1 rounded border">
                  {element.latex.formula}
                </div>
              </div>
            ) : (
              <div className="text-center text-green-600 dark:text-green-400">
                <div className="text-lg">∑</div>
                <div className="text-xs">双击编辑公式</div>
              </div>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="w-full h-full bg-black rounded overflow-hidden">
            {element.media?.src ? (
              <video
                src={element.media.src}
                poster={element.media.poster}
                controls={element.media.controls !== false}
                autoPlay={element.media.autoplay}
                loop={element.media.loop}
                muted
                className="w-full h-full object-cover"
                style={{
                  opacity: element.opacity,
                }}
              />
            ) : (
              <div className="w-full h-full bg-red-50 dark:bg-red-900/20 rounded flex items-center justify-center">
                <div className="text-center text-red-600 dark:text-red-400">
                  <div className="w-8 h-8 mx-auto mb-1">🎥</div>
                  <div className="text-xs">双击添加视频</div>
                </div>
              </div>
            )}
          </div>
        );

      case 'audio':
        return (
          <div className="w-full h-full bg-green-50 dark:bg-green-900/20 rounded flex items-center justify-center">
            {element.media?.src ? (
              <div className="text-center">
                <div className="w-8 h-8 mx-auto mb-2 text-2xl">🎵</div>
                <audio
                  src={element.media.src}
                  controls={element.media.controls !== false}
                  autoPlay={element.media.autoplay}
                  loop={element.media.loop}
                  className="max-w-full"
                />
              </div>
            ) : (
              <div className="text-center text-green-600 dark:text-green-400">
                <div className="w-8 h-8 mx-auto mb-1">🎵</div>
                <div className="text-xs">双击添加音频</div>
              </div>
            )}
          </div>
        );

      case 'group':
        // 处理group类型元素的渲染
        const groupElements = (element as any).elements || element.groupedElements || [];
        return (
          <div className="w-full h-full relative overflow-hidden">
            {groupElements.map((childElement: any, index: number) => {
              // 根据示例数据结构，子元素的坐标可能是相对于group的left/top
              // 需要将其转换为相对比例
              const childLeft = childElement.left || 0;
              const childTop = childElement.top || 0;
              const childWidth = childElement.width || 100;
              const childHeight = childElement.height || 100;
              
              // 计算子元素在组合中的相对位置和大小（百分比）
              const relativeX = (childLeft / element.width) * 100;
              const relativeY = (childTop / element.height) * 100;
              const relativeWidth = (childWidth / element.width) * 100;
              const relativeHeight = (childHeight / element.height) * 100;
              
              return (
                <div
                  key={`group-child-${index}`}
                  className="absolute"
                  style={{
                    left: `${relativeX}%`,
                    top: `${relativeY}%`,
                    width: `${relativeWidth}%`,
                    height: `${relativeHeight}%`,
                    transform: `rotate(${childElement.rotate || childElement.rotation || 0}deg)`,
                    opacity: childElement.opacity || 1,
                    zIndex: childElement.order || childElement.zIndex || index,
                  }}
                >
                  {/* 渲染不同类型的子元素 */}
                  {childElement.type === 'text' && (
                    <div
                      className="w-full h-full flex items-center justify-center overflow-hidden"
                      style={{
                        color: childElement.text?.color || '#374151',
                        fontSize: `${Math.max(childElement.text?.fontSize * canvasScale, 10)}px`,
                        fontFamily: childElement.text?.fontFamily || 'Inter, sans-serif',
                        fontWeight: childElement.text?.bold ? 'bold' : 'normal',
                        fontStyle: childElement.text?.italic ? 'italic' : 'normal',
                        textAlign: childElement.text?.align || 'left',
                        lineHeight: childElement.text?.lineHeight || 1.2,
                        // 为包含换行符的文本添加 pre-line 样式
                        whiteSpace: (childElement.content || childElement.text?.content || '').includes('\n') ? 'pre-line' : 'normal',
                      }}
                      dangerouslySetInnerHTML={{
                        __html: childElement.content || childElement.text?.content || '文本'
                      }}
                    />
                  )}

                  {childElement.type === 'shape' && (
                    <>
                      {/* 检查是否是路径形状 */}
                      {childElement.path ? (
                        <div className="w-full h-full relative">
                          <svg className="w-full h-full" viewBox={`0 0 ${childElement.width} ${childElement.height}`}>
                            <path
                              d={childElement.path}
                              fill={childElement.fill?.type === 'color' 
                                ? childElement.fill.value !== 'transparent' ? childElement.fill.value : 'none'
                                : childElement.fill && childElement.fill !== 'transparent' ? childElement.fill : 'none'}
                              stroke={childElement.borderColor || 'transparent'}
                              strokeWidth={childElement.borderWidth || 0}
                              strokeDasharray={childElement.borderStrokeDasharray !== "0" ? childElement.borderStrokeDasharray : undefined}
                            />
                          </svg>
                          
                          {/* 如果形状包含文本内容，叠加在SVG之上 */}
                          {childElement.content && (
                            <div 
                              className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
                              style={{
                                textAlign: childElement.vAlign === 'mid' ? 'center' : 'left',
                                alignItems: childElement.vAlign === 'mid' ? 'center' : 'flex-start',
                              }}
                              dangerouslySetInnerHTML={{
                                __html: childElement.content
                              }}
                            />
                          )}
                        </div>
                      ) : (
                        // 普通形状渲染
                        <div
                          className="w-full h-full"
                          style={{
                            backgroundColor: childElement.fill?.type === 'color' 
                              ? childElement.fill.value 
                              : childElement.shape?.fill || childElement.fill || 'transparent',
                            backgroundImage: childElement.shape?.gradient ?
                              `${childElement.shape.gradient.type}-gradient(${childElement.shape.gradient.angle}deg, ${childElement.shape.gradient.colors.join(', ')})` :
                              undefined,
                            border: `${childElement.borderWidth || childElement.shape?.strokeWidth || 0}px ${childElement.borderType || 'solid'} ${childElement.borderColor || childElement.shape?.stroke || 'transparent'}`,
                            borderRadius: childElement.shapType === 'circle' || childElement.shape?.type === 'circle' ? '50%' : '4px',
                          }}
                        >
                          {/* 如果形状包含文本内容 */}
                          {childElement.content && (
                            <div 
                              className="w-full h-full flex items-center justify-center overflow-hidden"
                              style={{
                                textAlign: childElement.vAlign === 'mid' ? 'center' : 'left',
                                alignItems: childElement.vAlign === 'mid' ? 'center' : 'flex-start',
                              }}
                              dangerouslySetInnerHTML={{
                                __html: childElement.content
                              }}
                            />
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {childElement.type === 'image' && childElement.image?.src && (
                    <img
                      src={childElement.image.src}
                      alt={childElement.image.alt || ''}
                      className="w-full h-full object-cover"
                      style={{
                        borderRadius: `${childElement.image.borderRadius || 0}px`,
                        filter: childElement.image.filters ? `
                          blur(${childElement.image.filters.blur || 0}px)
                          brightness(${childElement.image.filters.brightness || 100}%)
                          contrast(${childElement.image.filters.contrast || 100}%)
                          grayscale(${childElement.image.filters.grayscale || 0}%)
                          saturate(${childElement.image.filters.saturate || 100}%)
                          hue-rotate(${childElement.image.filters.hue || 0}deg)
                        ` : 'none',
                      }}
                    />
                  )}

                  {childElement.type === 'line' && (
                    <svg className="w-full h-full">
                      <line
                        x1="0"
                        y1="50%"
                        x2="100%"
                        y2="50%"
                        stroke={childElement.line?.stroke || '#374151'}
                        strokeWidth={childElement.line?.strokeWidth || 2}
                        strokeDasharray={childElement.line?.strokeDasharray}
                      />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        );

      default:
        return (
          <div className="w-full h-full bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
            <span className="text-xs text-gray-500">未知元素</span>
          </div>
        );
    }
  };

  // 渲染缩放手柄
  const renderResizeHandles = () => {
    if (!isSelected || element.locked) return null;

    const handleSize = 8;
    const handles = [
      { position: 'nw', cursor: 'nw-resize', top: -handleSize/2, left: -handleSize/2 },
      { position: 'n', cursor: 'n-resize', top: -handleSize/2, left: '50%', transform: 'translateX(-50%)' },
      { position: 'ne', cursor: 'ne-resize', top: -handleSize/2, right: -handleSize/2 },
      { position: 'e', cursor: 'e-resize', top: '50%', right: -handleSize/2, transform: 'translateY(-50%)' },
      { position: 'se', cursor: 'se-resize', bottom: -handleSize/2, right: -handleSize/2 },
      { position: 's', cursor: 's-resize', bottom: -handleSize/2, left: '50%', transform: 'translateX(-50%)' },
      { position: 'sw', cursor: 'sw-resize', bottom: -handleSize/2, left: -handleSize/2 },
      { position: 'w', cursor: 'w-resize', top: '50%', left: -handleSize/2, transform: 'translateY(-50%)' },
    ];

    return (
      <>
        {handles.map((handle) => (
          <div
            key={handle.position}
            className={cn(
              "absolute border-2 border-white shadow-sm transition-all duration-150",
              isResizing && resizeHandle === handle.position 
                ? "bg-yellow-500 scale-125" 
                : "bg-purple-500 hover:bg-purple-600 hover:scale-110"
            )}
            style={{
              width: handleSize,
              height: handleSize,
              cursor: handle.cursor,
              top: handle.top,
              left: handle.left,
              right: handle.right,
              bottom: handle.bottom,
              transform: handle.transform,
            }}
            onMouseDown={(e) => handleResizeMouseDown(e, handle.position)}
          />
        ))}
      </>
    );
  };

  return (
    <ElementContextMenu element={element}>
        <div
        ref={elementRef}
        data-element-id={element.id}
        className={cn(
          "absolute",
          isSelected && "ring-2 ring-purple-500 ring-offset-2 ring-offset-transparent",
          element.locked && "opacity-75",
          element.hidden && "opacity-30"
        )}
        style={{
          // 使用临时状态或元素状态
          left: (tempResizeState?.x ?? element.x) * canvasScale,
          top: (tempResizeState?.y ?? element.y) * canvasScale,
          width: (tempResizeState?.width ?? element.width) * canvasScale,
          height: (tempResizeState?.height ?? element.height) * canvasScale,
          transform: `rotate(${element.rotation}deg)`,
          opacity: element.opacity,
          zIndex: getPPTElementZIndex(element.zIndex),
          cursor: isDragging ? 'grabbing' : (element.locked ? 'not-allowed' : 'grab'),
        }}
        onClick={handleElementClick}
        onDoubleClick={handleElementDoubleClick}
        onMouseDown={handleMouseDown}
      >
        {/* 元素内容 */}
        {element.type === 'group' ? 
          renderUniversalElementContent(element, canvasScale, isEditingThis, updateElement, tempResizeState) : 
          renderElementContent()
        }

        {/* 缩放手柄 */}
        {renderResizeHandles()}

        {/* 选中状态指示器 */}
        {isSelected && (
          <div className="absolute -top-6 left-0 bg-purple-500 text-white text-xs px-2 py-1 rounded shadow-lg">
            {element.name || element.type}
            {element.locked && <span className="ml-1">🔒</span>}
            {isResizing && (
              <span className="ml-2 text-yellow-200">
                {Math.round(tempResizeState?.width ?? element.width)}×{Math.round(tempResizeState?.height ?? element.height)}
              </span>
            )}
          </div>
        )}
        
        {/* 缩放提示 */}
        {isResizing && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/75 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            按住 Shift 保持比例
          </div>
        )}
      </div>
    </ElementContextMenu>
  );
}