'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { usePPTStore } from '../store/ppt-store';
import { EditableElement } from './EditableElement';
import { AlignmentLines } from './AlignmentLines';
import { SelectionBox } from './SelectionBox';
import { ElementCreator } from './ElementCreator';
import { CanvasContextMenu } from './ContextMenu';
import { AlignmentToolbar } from './AlignmentToolbar';
import { cn } from '@/lib/utils';
import { Z_INDEX } from '../constants/z-index';
import { getCanvasDimensions } from '../constants/canvas';

// 动态获取画布尺寸，从store获取
const getCanvasSize = (canvasSize?: any) => getCanvasDimensions(canvasSize);

export function Canvas() {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 });
  const [draggingElement, setDraggingElement] = useState<any>(null);
  
  const {
    slides,
    activeSlideIndex,
    canvasScale,
    canvasOffsetX,
    canvasOffsetY,
    showGrid,
    showRuler,
    gridSize,
    activeElementIds,
    selectedTool,
    creatingElement,
    canvasSize,
    setCanvasScale,
    setCanvasOffset,
    selectElements,
    clearSelection,
    addElement,
    debugState,
    manualRestoreFromIndexedDB,
    debugElementZIndex,
  } = usePPTStore();

  const currentSlide = slides[activeSlideIndex];
  
  // 调试信息 (已优化 - 减少性能影响)
  // useEffect(() => {
  //   console.log('Canvas渲染状态:', {
  //     slidesCount: slides.length,
  //     activeSlideIndex,
  //     currentSlide: currentSlide?.id
  //   });
  // });



  // 处理鼠标滚轮缩放
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setCanvasScale(canvasScale + delta);
    }
  }, [canvasScale, setCanvasScale]);

  // 自适应父宽并在容器中居中
  const fitWidth = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // 计算可用空间时考虑标尺偏移
    const rulerOffset = showRuler ? 32 : 0; // 标尺占用的空间
    const availableWidth = container.clientWidth - rulerOffset;
    const availableHeight = container.clientHeight - rulerOffset;
    
    // 计算适配缩放比例
    const canvasDimensions = getCanvasSize(canvasSize);
    const scaleByWidth = availableWidth / canvasDimensions.width;
    const scaleByHeight = availableHeight / canvasDimensions.height;
    const scale = Math.max(0.25, Math.min(4, Math.min(scaleByWidth, scaleByHeight) * 0.9)); // 留10%边距
    
    // 计算居中位置
    const scaledWidth = canvasDimensions.width * scale;
    const scaledHeight = canvasDimensions.height * scale;
    
    const left = (container.clientWidth - scaledWidth) / 2;
    const top = (container.clientHeight - scaledHeight) / 2;
    
    setCanvasScale(scale);
    setCanvasOffset(left, top);
  }, [setCanvasScale, setCanvasOffset, showRuler]);

  // 空格键状态
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // 处理空格键拖拽
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space' && !isDragging && !isSpacePressed) {
      e.preventDefault();
      setIsSpacePressed(true);
      document.body.style.cursor = 'grab';
    }
    // 快捷键：Cmd/Ctrl + F 适配宽度并居中
    if (e.code === 'KeyF' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      // 延后执行以避免与其它按键事件冲突
      setTimeout(() => {
        fitWidth();
      }, 0);
    }
  }, [isDragging, isSpacePressed, fitWidth]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space') {
      setIsSpacePressed(false);
      if (!isDragging) {
        document.body.style.cursor = 'default';
      }
    }
  }, [isDragging]);

  useEffect(() => {
    fitWidth();
    const onResize = () => fitWidth();
    const onResetCanvas = () => fitWidth();
    
    window.addEventListener('resize', onResize);
    window.addEventListener('resetCanvasView', onResetCanvas);
    
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('resetCanvasView', onResetCanvas);
    };
  }, [fitWidth]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // 监听添加图片元素的事件
    const handleAddImageElement = (e: CustomEvent) => {
      const { src, alt, x, y, width, height } = e.detail;
      addElement({
        type: 'image',
        x,
        y,
        width,
        height,
        rotation: 0,
        opacity: 1,
        locked: false,
        hidden: false,
        zIndex: 1, // 使用默认值，由addElement自动调整
        image: {
          src,
          alt,
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

    window.addEventListener('addImageElement', handleAddImageElement as EventListener);

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('addImageElement', handleAddImageElement as EventListener);
      document.body.style.cursor = 'default';
    };
  }, [handleWheel, handleKeyDown, handleKeyUp, addElement]);

  // 处理画布点击
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      clearSelection();
    }
  };

  // 处理画布双击
  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    console.log(selectedTool)
    console.log(e.target )
    console.log(e.currentTarget)
    // if (e.target === e.currentTarget) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // 双击创建元素：文字、形状、线条、表格、图表需要双击
      // console.log(selectedTool)  // 性能优化：注释调试输出
      if (['text', 'shape', 'line', 'table', 'chart'].includes(selectedTool)) {
        handleCreateElement(x, y);
      }
    // }
  };

  // 处理画布拖拽
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 && e.button !== 1) return; // 处理左键和中键
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 检查是否点击在画布空白区域 (画布背景区域)
    const isCanvasBackground = e.target === e.currentTarget || 
                               (e.target as HTMLElement)?.hasAttribute?.('data-canvas-container') ||
                               (e.target as HTMLElement)?.hasAttribute?.('data-slide-canvas');

    // 当按住空格键+左键，或者按住中键，或者在画布空白区域按住Alt+左键时，启用画布拖拽
    if (isSpacePressed || e.button === 1 || (isCanvasBackground && e.altKey)) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - canvasOffsetX, y: e.clientY - canvasOffsetY });
      document.body.style.cursor = 'grabbing';
      e.preventDefault();
      return;
    }

    if (selectedTool === 'select' && isCanvasBackground) {
      // 框选模式
      setIsSelecting(true);
      setSelectionStart({ x, y });
      setSelectionEnd({ x, y });
    }
    // 只有图片、媒体和选择工具需要单击创建，其他工具需要双击
    else if (selectedTool === 'image' || selectedTool === 'media') {
      handleCreateElement(x, y);
    }
    // 其他工具（text, shape, line, table, chart）需要双击才能创建
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const newOffsetX = e.clientX - dragStart.x;
      const newOffsetY = e.clientY - dragStart.y;
      setCanvasOffset(newOffsetX, newOffsetY);
    }
    
    if (isSelecting) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setSelectionEnd({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    }
  };

  const handleCanvasMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      document.body.style.cursor = 'default';
    }
    
    if (isSelecting) {
      setIsSelecting(false);
      // 处理框选结果
      const selectionRect = {
        x: Math.min(selectionStart.x, selectionEnd.x),
        y: Math.min(selectionStart.y, selectionEnd.y),
        width: Math.abs(selectionEnd.x - selectionStart.x),
        height: Math.abs(selectionEnd.y - selectionStart.y),
      };
      
      // 只有当选择框足够大时才进行框选
      if (selectionRect.width > 5 && selectionRect.height > 5) {
        // 查找在选择框内的元素
        const selectedElements = currentSlide?.elements.filter(element => {
          if (element.hidden || element.locked) return false;
          
          const elementRect = {
            x: element.x * canvasScale + canvasOffsetX,
            y: element.y * canvasScale + canvasOffsetY,
            width: element.width * canvasScale,
            height: element.height * canvasScale,
          };
          
          // 检查元素是否完全在选择框内
          return (
            elementRect.x >= selectionRect.x &&
            elementRect.y >= selectionRect.y &&
            elementRect.x + elementRect.width <= selectionRect.x + selectionRect.width &&
            elementRect.y + elementRect.height <= selectionRect.y + selectionRect.height
          );
        }) || [];
        
        if (selectedElements.length > 0) {
          selectElements(selectedElements.map(el => el.id));
        } else {
          clearSelection();
        }
      }
    }
  };

  // 创建元素 - 支持所有工具类型
  const handleCreateElement = (x: number, y: number) => {
    // 如果有创建中的元素类型，使用该类型，否则使用当前选择的工具
    const elementType = creatingElement.type || selectedTool;
    if (!elementType || elementType === 'select') return;
    
    // 转换画布坐标
    const elementX = (x - canvasOffsetX) / canvasScale;
    const elementY = (y - canvasOffsetY) / canvasScale;
    
    const baseElement = {
      x: elementX,
      y: elementY,
      width: 200,
      height: 100,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      zIndex: Date.now(), // 简单的z-index生成
    };

    // 根据元素类型设置默认属性
    switch (elementType) {
      case 'text':
        addElement({
          ...baseElement,
          type: 'text',
          text: {
            content: '请输入文本',
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
        break;
        
      case 'shape':
        addElement({
          ...baseElement,
          type: 'shape',
          shape: {
            type: 'rectangle',
            fill: '#6366F1',
            stroke: '#4F46E5',
            strokeWidth: 2,
            text: {
              content: '双击编辑文本',
              fontSize: 16,
              fontFamily: 'Arial',
              color: '#FFFFFF',
              bold: false,
              italic: false,
              underline: false,
              strikethrough: false,
              align: 'center',
              verticalAlign: 'middle',
              lineHeight: 1.2,
              letterSpacing: 0,
            },
          },
        });
        break;
        
      case 'line':
        addElement({
          ...baseElement,
          type: 'line',
          width: 200,
          height: 20,
          line: {
            type: 'straight',
            stroke: '#374151',
            strokeWidth: 2,
            strokeDasharray: '',
            startMarker: 'none',
            endMarker: 'arrow',
            points: [
              { x: 0, y: 10 },
              { x: 200, y: 10 }
            ],
          },
        });
        break;
        
      case 'table':
        addElement({
          ...baseElement,
          type: 'table',
          width: 300,
          height: 200,
          table: {
            rows: 3,
            cols: 3,
            data: [
              ['标题1', '标题2', '标题3'],
              ['内容1', '内容2', '内容3'],
              ['内容4', '内容5', '内容6']
            ],
            cellStyle: {
              fontSize: 14,
              color: '#374151',
              backgroundColor: '#FFFFFF',
              align: 'left',
              bold: false,
              italic: false,
            },
            headerStyle: {
              fontSize: 14,
              color: '#FFFFFF',
              backgroundColor: '#6366F1',
              align: 'center',
              bold: true,
              italic: false,
            },
            borderStyle: {
              width: 1,
              color: '#E5E7EB',
              style: 'solid',
            },
          },
        });
        break;
        
      case 'chart':
        addElement({
          ...baseElement,
          type: 'chart',
          width: 400,
          height: 300,
          chart: {
            type: 'bar',
            data: [
              { name: 'A', value: 30 },
              { name: 'B', value: 80 },
              { name: 'C', value: 45 },
              { name: 'D', value: 60 },
              { name: 'E', value: 20 }
            ],
            theme: 'default',
            options: {
              title: '示例图表',
              showLegend: true,
              showGrid: true,
            },
          },
        });
        break;
        
      case 'image':
        // 创建文件输入元素
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const result = e.target?.result as string;
              addElement({
                ...baseElement,
                type: 'image',
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
        break;
        
      case 'media':
        // 创建文件输入元素
        const mediaInput = document.createElement('input');
        mediaInput.type = 'file';
        mediaInput.accept = 'video/*,audio/*';
        mediaInput.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const result = e.target?.result as string;
              const fileType = file.type.startsWith('video') ? 'video' : 'audio';
              addElement({
                ...baseElement,
                type: fileType as 'video' | 'audio',
                width: fileType === 'video' ? 400 : 200,
                height: fileType === 'video' ? 300 : 100,
                media: {
                  src: result,
                  autoplay: false,
                  loop: false,
                  controls: true,
                },
              });
            };
            reader.readAsDataURL(file);
          }
        };
        mediaInput.click();
        break;
        
      default:
        addElement({
          ...baseElement,
          type: 'text',
        });
    }
  };

  return (
    <div 
      className="flex-1 flex flex-col overflow-hidden"
      style={{ backgroundColor: '#F9FAFB' }}
    >
  
        
      {/* 画布容器 */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-hidden relative"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onClick={handleCanvasClick}
        onDoubleClick={handleCanvasDoubleClick}
        onContextMenu={(e) => e.preventDefault()} // 禁用右键菜单
      >
        {/* 标尺 */}
        {showRuler && (
          <>
            {/* 水平标尺 */}
            <div className="absolute top-0 left-8 right-0 h-8 bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600 z-10">
              <div className="relative h-full">
                {Array.from({ length: Math.ceil(getCanvasSize(canvasSize).width / 50) }, (_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 h-full border-l border-gray-400 dark:border-gray-500"
                    style={{
                      left: `${((i * 50) * canvasScale + canvasOffsetX)}px`,
                    }}
                  >
                    <span className="absolute top-1 left-1 text-xs text-gray-500 dark:text-gray-400">
                      {i * 50}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 垂直标尺 */}
            <div className="absolute top-8 left-0 bottom-0 w-8 bg-white dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600 z-10">
              <div className="relative w-full h-full">
                {Array.from({ length: Math.ceil(getCanvasSize(canvasSize).height / 50) }, (_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 w-full border-t border-gray-400 dark:border-gray-500"
                    style={{
                      top: `${((i * 50) * canvasScale + canvasOffsetY)}px`,
                    }}
                  >
                    <span className="absolute top-1 left-1 text-xs text-gray-500 dark:text-gray-400 transform -rotate-90 origin-left">
                      {i * 50}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 画布区域 */}
        <CanvasContextMenu onAddElement={(type) => {
          // 在画布中心创建元素
          const centerX = (960 - 200) / 2;
          const centerY = (540 - 100) / 2;
          handleCreateElement(centerX * canvasScale + canvasOffsetX, centerY * canvasScale + canvasOffsetY);
        }}>
          <div 
            ref={canvasRef}
            className={cn(
              "absolute inset-0 overflow-hidden",
              showRuler ? "top-8 left-8" : "top-0 left-0"
            )}
            style={{
              cursor: isDragging ? 'grabbing' : 'default',
            }}
          >
          {/* 画布背景 */}
          <div
            id={`slide-${activeSlideIndex}`}
            data-slide-id={currentSlide?.id}
            data-slide-canvas
            data-canvas-container
            className="absolute border"
            style={{
              width: getCanvasSize(canvasSize).width * canvasScale,
              height: getCanvasSize(canvasSize).height * canvasScale,
              left: canvasOffsetX,
              top: canvasOffsetY,
              backgroundColor: currentSlide?.background?.type === 'color' ? currentSlide.background.value : '#FFFFFF',
              backgroundImage: currentSlide?.background?.type === 'gradient' ? currentSlide.background.value : 
                              currentSlide?.background?.type === 'image' ? `url(${currentSlide.background.value})` : undefined,
              backgroundSize: currentSlide?.background?.type === 'image' ? (currentSlide.background.imageSize || 'cover') : undefined,
              backgroundRepeat: currentSlide?.background?.type === 'image' && currentSlide.background.imageSize === 'repeat' ? 'repeat' : 'no-repeat',
              backgroundPosition: currentSlide?.background?.type === 'image' ? 'center' : undefined,
              opacity: currentSlide?.background?.type === 'image' && currentSlide.background.opacity !== undefined ? 
                      currentSlide.background.opacity : 1,
              borderColor: '#C7D2FE',
              boxShadow: '0 8px 16px rgba(99, 102, 241, 0.15)',
            }}
          >
            {/* 网格线 */}
            {showGrid && (
              <div 
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, #6366F1 1px, transparent 1px),
                    linear-gradient(to bottom, #6366F1 1px, transparent 1px)
                  `,
                  backgroundSize: `${gridSize * canvasScale}px ${gridSize * canvasScale}px`,
                }}
              />
            )}

            {/* 渲染元素 - 按zIndex排序确保正确的层级 */}
            {currentSlide?.elements
              .slice() // 创建副本避免修改原数组
              .sort((a, b) => a.zIndex - b.zIndex) // 按zIndex从小到大排序，zIndex小的在底层
              .map((element) => (
                <EditableElement
                  key={element.id}
                  element={element}
                  isSelected={activeElementIds.includes(element.id)}
                  canvasScale={canvasScale}
                  onDragStart={(el) => setDraggingElement(el)}
                  onDragEnd={() => setDraggingElement(null)}
                />
              ))
            }

            {/* 对齐线 */}
            <AlignmentLines 
              draggingElement={draggingElement}
              showLines={!!draggingElement}
            />
          </div>

          {/* 框选框 */}
          {isSelecting && (
            <SelectionBox
              start={selectionStart}
              end={selectionEnd}
            />
          )}
          </div>
        </CanvasContextMenu>

        {/* 对齐工具栏 */}
        <AlignmentToolbar />
      </div>
    </div>
  );
}