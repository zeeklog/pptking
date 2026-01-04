'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Square,
  Pen,
  Eraser,
  Palette,
  Timer,
  Eye,
  Grid,
  Maximize,
  Volume2,
  VolumeX
} from 'lucide-react';
import { usePPTStore } from '../store/ppt-store';
import { EditableElement } from './EditableElement';
import { WritingBoard } from './WritingBoard';
import { cn } from '@/lib/utils';
import { Z_INDEX } from '../constants/z-index';
import { getCanvasDimensions } from '../constants/canvas';

interface PresentationModeProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'presenter' | 'audience';
}

export function PresentationMode({ isOpen, onClose, mode = 'audience' }: PresentationModeProps) {
  const { t } = useTranslation();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showDrawingTools, setShowDrawingTools] = useState(false);
  const [drawingTool, setDrawingTool] = useState<'pen' | 'eraser' | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  
  const { slides } = usePPTStore();
  const currentSlide = slides[currentSlideIndex];

  // 键盘控制
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          previousSlide();
          break;
        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
        case ' ':
          e.preventDefault();
          nextSlide();
          break;
        case 'Home':
          setCurrentSlideIndex(0);
          break;
        case 'End':
          setCurrentSlideIndex(slides.length - 1);
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'b':
        case 'B':
          // 黑屏
          console.log('Toggle black screen');
          break;
        case 'w':
        case 'W':
          // 白屏
          console.log('Toggle white screen');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentSlideIndex, slides.length]);

  // 自动播放
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      if (currentSlideIndex < slides.length - 1) {
        setCurrentSlideIndex(prev => prev + 1);
      } else {
        setIsPlaying(false);
      }
    }, 5000); // 5秒自动切换

    return () => clearInterval(timer);
  }, [isPlaying, currentSlideIndex, slides.length]);

  // 倒计时
  useEffect(() => {
    if (!isCountdownActive || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setIsCountdownActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isCountdownActive, countdown]);

  const nextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    }
  };

  const previousSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    }
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };

  const startCountdown = (minutes: number) => {
    setCountdown(minutes * 60);
    setIsCountdownActive(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black flex flex-col" style={{ zIndex: Z_INDEX.PRESENTATION_MODE }}>
      {/* 控制栏 */}
      <div 
        className={cn(
          "absolute top-0 left-0 right-0 bg-black/80 text-white p-4 flex items-center justify-between transition-transform duration-300 z-10",
          !showControls && "-translate-y-full"
        )}
        onMouseEnter={() => setShowControls(true)}
      >
        <div className="flex items-center gap-4">
          {/* 基础控制 */}
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="w-4 h-4 mr-2" />
            退出放映
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={previousSlide}
              disabled={currentSlideIndex === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <span className="text-sm">
              {currentSlideIndex + 1} / {slides.length}
            </span>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={nextSlide}
              disabled={currentSlideIndex === slides.length - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* 倒计时 */}
          {isCountdownActive && (
            <div className="flex items-center gap-2 bg-red-600 px-3 py-1 rounded">
              <Timer className="w-4 h-4" />
              <span className="font-mono">
                {Math.floor(countdown / 60).toString().padStart(2, '0')}:
                {(countdown % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}

          {/* 工具按钮 */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={() => setShowDrawingTools(!showDrawingTools)}
            >
              <Pen className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={() => startCountdown(10)}
            >
              <Timer className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "text-white hover:bg-white/20",
                isPlaying && "bg-white/20"
              )}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={toggleFullscreen}
            >
              <Maximize className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 绘图工具栏 */}
      {showDrawingTools && (
        <div className="absolute top-20 left-4 bg-black/80 text-white p-2 rounded flex flex-col gap-2">
          <Button
            variant={drawingTool === 'pen' ? "default" : "ghost"}
            size="sm"
            className="text-white hover:bg-white/20"
            onClick={() => setDrawingTool(drawingTool === 'pen' ? null : 'pen')}
          >
            <Pen className="w-4 h-4" />
          </Button>
          
          <Button
            variant={drawingTool === 'eraser' ? "default" : "ghost"}
            size="sm"
            className="text-white hover:bg-white/20"
            onClick={() => setDrawingTool(drawingTool === 'eraser' ? null : 'eraser')}
          >
            <Eraser className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
                          onClick={() => {
                // 清除所有批注
                const writingBoard = document.querySelector('[data-writing-board]') as any;
                if (writingBoard && writingBoard.clearAll) {
                  writingBoard.clearAll();
                } else {
                  // 通过事件系统清除
                  window.dispatchEvent(new CustomEvent('clearWritingBoard'));
                }
              }}
          >
            <Square className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* 主要内容区域 */}
      <div 
        className="flex-1 flex items-center justify-center relative"
        onClick={() => setShowControls(!showControls)}
      >
        {/* 幻灯片内容 */}
        {currentSlide && React.createElement(() => {
          // 计算最佳尺寸，保持16:9比例且不超出屏幕
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          const aspectRatio = 16 / 9;
          
          // 计算基于宽度的高度
          let slideWidth = Math.min(viewportWidth * 0.9, 1920);
          let slideHeight = slideWidth / aspectRatio;
          
          // 如果高度超出，则基于高度计算宽度
          if (slideHeight > viewportHeight * 0.9) {
            slideHeight = Math.min(viewportHeight * 0.9, 1080);
            slideWidth = slideHeight * aspectRatio;
          }
          
          return (
            <div 
              className="relative bg-white shadow-2xl"
              style={{
                width: slideWidth,
                height: slideHeight,
                backgroundColor: currentSlide.background?.type === 'color' ? currentSlide.background.value : '#FFFFFF',
                background: currentSlide.background?.type === 'gradient' ? currentSlide.background.value : 
                           currentSlide.background?.type === 'image' ? `url(${currentSlide.background.value})` : undefined,
                backgroundSize: currentSlide.background?.type === 'image' ? (currentSlide.background.imageSize || 'cover') : undefined,
                backgroundRepeat: currentSlide.background?.type === 'image' && currentSlide.background.imageSize === 'repeat' ? 'repeat' : 'no-repeat',
                backgroundPosition: currentSlide.background?.type === 'image' ? 'center' : undefined,
                opacity: currentSlide.background?.type === 'image' && currentSlide.background.opacity !== undefined ? 
                        currentSlide.background.opacity : 1,
              }}
            >
              {/* 渲染元素 - 按zIndex排序 */}
              {currentSlide.elements
                .slice() // 创建副本避免修改原数组
                .sort((a, b) => a.zIndex - b.zIndex) // 按zIndex从小到大排序
                .map((element) => {
                // 计算缩放比例
                const canvasSize = getCanvasDimensions();
                const scaleX = slideWidth / canvasSize.width;
                const scaleY = slideHeight / canvasSize.height;
                
                return (
                  <div
                    key={element.id}
                    className="absolute"
                    style={{
                      left: `${element.x * scaleX}px`,
                      top: `${element.y * scaleY}px`,
                      width: `${element.width * scaleX}px`,
                      height: `${element.height * scaleY}px`,
                      transform: `rotate(${element.rotation}deg)`,
                      transformOrigin: 'center',
                      opacity: element.opacity,
                      zIndex: element.zIndex,
                    }}
                  >
                    <EditableElement
                      element={element}
                      isSelected={false}
                      canvasScale={scaleX}
                    />
                  </div>
                );
              })}

              {/* 批注层 */}
              <WritingBoard
                isActive={!!drawingTool}
                onClose={() => setDrawingTool(null)}
              />
            </div>
          );
        })}
      </div>

      {/* 底部缩略图导航 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 rounded-lg p-2 flex gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            className={cn(
              "w-16 h-9 rounded border-2 transition-all",
              index === currentSlideIndex 
                ? "border-purple-400 bg-purple-500/20" 
                : "border-gray-500 hover:border-gray-400"
            )}
            onClick={() => setCurrentSlideIndex(index)}
          >
            <div 
              className="w-full h-full rounded-sm"
              style={{ 
                backgroundColor: slide.background?.type === 'color' ? slide.background.value : '#FFFFFF',
                background: slide.background?.type === 'gradient' ? slide.background.value : 
                           slide.background?.type === 'image' ? `url(${slide.background.value})` : undefined,
                backgroundSize: slide.background?.type === 'image' ? (slide.background.imageSize || 'cover') : 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                opacity: slide.background?.type === 'image' && slide.background.opacity !== undefined ? 
                        slide.background.opacity : 1,
              }}
            />
          </button>
        ))}
      </div>

      {/* 演讲者备注 - 仅演讲者模式显示 */}
      {mode === 'presenter' && currentSlide?.notes && (
        <div className="absolute bottom-20 left-4 right-4 bg-black/80 text-white p-4 rounded max-h-32 overflow-auto">
          <h4 className="text-sm font-medium mb-2">演讲者备注:</h4>
          <div className="text-sm whitespace-pre-wrap">{currentSlide.notes}</div>
        </div>
      )}
    </div>
  );
}