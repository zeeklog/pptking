'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Pen, 
  Eraser, 
  Palette,
  Undo,
  Redo,
  Trash2,
  Circle,
  Square,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DrawingPath {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
  tool: 'pen' | 'highlighter' | 'arrow' | 'rectangle' | 'circle';
  opacity: number;
}

interface WritingBoardProps {
  isActive: boolean;
  onClose: () => void;
}

export function WritingBoard({ isActive, onClose }: WritingBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<DrawingPath | null>(null);
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [pathHistory, setPathHistory] = useState<DrawingPath[][]>([]);
  
  // 工具状态
  const [selectedTool, setSelectedTool] = useState<'pen' | 'highlighter' | 'eraser' | 'arrow' | 'rectangle' | 'circle'>('pen');
  const [brushSize, setBrushSize] = useState(3);
  const [brushColor, setBrushColor] = useState('#FF0000');
  const [isBlackboard, setIsBlackboard] = useState(false);

  const colors = [
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
    '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#000000', '#FFFFFF'
  ];

  // 初始化画布
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布尺寸为全屏
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // 设置画布样式
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // 清空画布
    if (isBlackboard) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // 监听清除事件
    const handleClearEvent = () => {
      handleClear();
    };

    window.addEventListener('clearWritingBoard', handleClearEvent);
    
    return () => {
      window.removeEventListener('clearWritingBoard', handleClearEvent);
    };
  }, [isActive, isBlackboard]);

  // 重绘所有路径
  const redrawPaths = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // 清空画布
    if (isBlackboard) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // 绘制所有路径
    paths.forEach(path => {
      if (path.points.length < 2) return;

      ctx.globalAlpha = path.opacity;
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.width;

      if (path.tool === 'pen' || path.tool === 'highlighter') {
        ctx.beginPath();
        ctx.moveTo(path.points[0].x, path.points[0].y);
        path.points.forEach(point => {
          ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
      } else if (path.tool === 'rectangle') {
        const startPoint = path.points[0];
        const endPoint = path.points[path.points.length - 1];
        ctx.strokeRect(
          startPoint.x,
          startPoint.y,
          endPoint.x - startPoint.x,
          endPoint.y - startPoint.y
        );
      } else if (path.tool === 'circle') {
        const startPoint = path.points[0];
        const endPoint = path.points[path.points.length - 1];
        const radius = Math.sqrt(
          Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2)
        ) / 2;
        ctx.beginPath();
        ctx.arc(
          (startPoint.x + endPoint.x) / 2,
          (startPoint.y + endPoint.y) / 2,
          radius,
          0,
          2 * Math.PI
        );
        ctx.stroke();
      } else if (path.tool === 'arrow') {
        const startPoint = path.points[0];
        const endPoint = path.points[path.points.length - 1];
        drawArrow(ctx, startPoint.x, startPoint.y, endPoint.x, endPoint.y);
      }
    });

    ctx.globalAlpha = 1;
  }, [paths, isBlackboard]);

  // 当路径或黑板模式改变时重绘画布
  useEffect(() => {
    if (isActive) {
      redrawPaths();
    }
  }, [isActive, paths, isBlackboard, redrawPaths]);

  // 绘制箭头
  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
    const headlen = 15;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  };

  // 开始绘制
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool === 'eraser') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newPath: DrawingPath = {
      id: `path-${Date.now()}`,
      points: [{ x, y }],
      color: brushColor,
      width: brushSize,
      tool: selectedTool,
      opacity: selectedTool === 'highlighter' ? 0.5 : 1,
    };

    setCurrentPath(newPath);
    setIsDrawing(true);
  };

  // 绘制过程
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentPath) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (selectedTool === 'pen' || selectedTool === 'highlighter') {
      // 自由绘制
      const updatedPath = {
        ...currentPath,
        points: [...currentPath.points, { x, y }],
      };
      setCurrentPath(updatedPath);

      // 实时绘制
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.globalAlpha = updatedPath.opacity;
        ctx.strokeStyle = updatedPath.color;
        ctx.lineWidth = updatedPath.width;
        ctx.beginPath();
        const prevPoint = updatedPath.points[updatedPath.points.length - 2];
        ctx.moveTo(prevPoint.x, prevPoint.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    } else {
      // 形状绘制（矩形、圆形、箭头）
      const updatedPath = {
        ...currentPath,
        points: [currentPath.points[0], { x, y }],
      };
      setCurrentPath(updatedPath);
      
      // 重绘画布以显示临时形状
      redrawPaths();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.globalAlpha = updatedPath.opacity;
        ctx.strokeStyle = updatedPath.color;
        ctx.lineWidth = updatedPath.width;
        
        if (selectedTool === 'rectangle') {
          const startPoint = updatedPath.points[0];
          ctx.strokeRect(
            startPoint.x,
            startPoint.y,
            x - startPoint.x,
            y - startPoint.y
          );
        } else if (selectedTool === 'circle') {
          const startPoint = updatedPath.points[0];
          const radius = Math.sqrt(
            Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2)
          ) / 2;
          ctx.beginPath();
          ctx.arc(
            (startPoint.x + x) / 2,
            (startPoint.y + y) / 2,
            radius,
            0,
            2 * Math.PI
          );
          ctx.stroke();
        } else if (selectedTool === 'arrow') {
          drawArrow(ctx, currentPath.points[0].x, currentPath.points[0].y, x, y);
        }
        
        ctx.globalAlpha = 1;
      }
    }
  };

  // 结束绘制
  const stopDrawing = () => {
    if (!isDrawing || !currentPath) return;

    setIsDrawing(false);
    
    // 添加路径到历史记录
    const newPaths = [...paths, currentPath];
    setPaths(newPaths);
    
    // 更新历史记录
    const newHistory = pathHistory.slice(0, historyIndex + 1);
    newHistory.push(newPaths);
    setPathHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    setCurrentPath(null);
  };

  // 橡皮擦功能
  const handleEraser = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool !== 'eraser') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 查找要擦除的路径
    const newPaths = paths.filter(path => {
      return !path.points.some(point => {
        const distance = Math.sqrt(
          Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2)
        );
        return distance < brushSize * 2;
      });
    });

    if (newPaths.length !== paths.length) {
      setPaths(newPaths);
      redrawPaths();
    }
  };

  // 撤销
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setPaths(pathHistory[historyIndex - 1] || []);
    }
  };

  // 重做
  const handleRedo = () => {
    if (historyIndex < pathHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setPaths(pathHistory[historyIndex + 1] || []);
    }
  };

  // 清除所有批注
  const handleClear = () => {
    setPaths([]);
    const newHistory = [...pathHistory, []];
    setPathHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    redrawPaths();
  };

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* 画布 */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        style={{
          backgroundColor: isBlackboard ? '#000000' : 'transparent',
        }}
        onMouseDown={selectedTool === 'eraser' ? handleEraser : startDrawing}
        onMouseMove={selectedTool === 'eraser' ? handleEraser : draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />

      {/* 工具栏 */}
      <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 space-y-3">
        {/* 工具选择 */}
        <div className="flex gap-1">
          <Button
            variant={selectedTool === 'pen' ? 'default' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setSelectedTool('pen')}
            title="钢笔"
          >
            <Pen className="w-4 h-4" />
          </Button>
          
          <Button
            variant={selectedTool === 'highlighter' ? 'default' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setSelectedTool('highlighter')}
            title="荧光笔"
          >
            <div className="w-4 h-2 bg-yellow-400 rounded" />
          </Button>
          
          <Button
            variant={selectedTool === 'arrow' ? 'default' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setSelectedTool('arrow')}
            title="箭头"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
          
          <Button
            variant={selectedTool === 'rectangle' ? 'default' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setSelectedTool('rectangle')}
            title="矩形"
          >
            <Square className="w-4 h-4" />
          </Button>
          
          <Button
            variant={selectedTool === 'circle' ? 'default' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setSelectedTool('circle')}
            title="圆形"
          >
            <Circle className="w-4 h-4" />
          </Button>
          
          <Button
            variant={selectedTool === 'eraser' ? 'default' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setSelectedTool('eraser')}
            title="橡皮擦"
          >
            <Eraser className="w-4 h-4" />
          </Button>
        </div>

        {/* 颜色选择 */}
        <div className="grid grid-cols-5 gap-1">
          {colors.map(color => (
            <button
              key={color}
              className={cn(
                "w-6 h-6 rounded border-2 transition-all",
                brushColor === color ? "border-gray-800 scale-110" : "border-gray-300"
              )}
              style={{ backgroundColor: color }}
              onClick={() => setBrushColor(color)}
            />
          ))}
        </div>

        {/* 画笔大小 */}
        <div className="space-y-2">
          <div className="text-xs text-gray-600 dark:text-gray-400">画笔大小: {brushSize}px</div>
          <Slider
            value={[brushSize]}
            onValueChange={(value) => setBrushSize(value[0])}
            min={1}
            max={20}
            step={1}
            className="w-24"
          />
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            title="撤销"
          >
            <Undo className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleRedo}
            disabled={historyIndex >= pathHistory.length - 1}
            title="重做"
          >
            <Redo className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleClear}
            title="清除全部"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* 黑板模式 */}
        <Button
          variant={isBlackboard ? 'default' : 'ghost'}
          size="sm"
          className="w-full h-8"
          onClick={() => setIsBlackboard(!isBlackboard)}
        >
          {isBlackboard ? '退出黑板' : '黑板模式'}
        </Button>

        {/* 关闭按钮 */}
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8"
          onClick={onClose}
        >
          关闭批注
        </Button>
      </div>
    </div>
  );
}