'use client';

import { usePPTStore, PPTElement } from '../store/ppt-store';
import { Z_INDEX } from '../constants/z-index';

interface AlignmentLine {
  type: 'horizontal' | 'vertical';
  position: number;
  start: number;
  end: number;
  color: string;
}

interface AlignmentLinesProps {
  draggingElement?: PPTElement;
  showLines?: boolean;
}

export function AlignmentLines({ draggingElement, showLines = false }: AlignmentLinesProps) {
  const { 
    slides, 
    activeSlideIndex, 
    canvasScale, 
    canvasOffsetX, 
    canvasOffsetY 
  } = usePPTStore();
  
  const currentSlide = slides[activeSlideIndex];
  
  // 计算对齐线
  const getAlignmentLines = (): AlignmentLine[] => {
    if (!draggingElement || !currentSlide || !showLines) return [];
    
    const lines: AlignmentLine[] = [];
    const tolerance = 5 / canvasScale; // 对齐容差
    
    // 画布边界线
    const canvasLines = [
      // 垂直线
      { type: 'vertical' as const, pos: 0, label: '左边界' },
      { type: 'vertical' as const, pos: 480, label: '中心线' }, // 画布中心
      { type: 'vertical' as const, pos: 960, label: '右边界' },
      // 水平线
      { type: 'horizontal' as const, pos: 0, label: '上边界' },
      { type: 'horizontal' as const, pos: 270, label: '中心线' }, // 画布中心
      { type: 'horizontal' as const, pos: 540, label: '下边界' },
    ];
    
    // 检查与画布的对齐
    canvasLines.forEach(line => {
      const dragElementCenter = {
        x: draggingElement.x + draggingElement.width / 2,
        y: draggingElement.y + draggingElement.height / 2,
      };
      
      if (line.type === 'vertical') {
        // 检查左边缘、中心、右边缘对齐
        if (Math.abs(draggingElement.x - line.pos) < tolerance) {
          lines.push({
            type: 'vertical',
            position: line.pos * canvasScale + canvasOffsetX,
            start: 0,
            end: 540 * canvasScale,
            color: '#EF4444',
          });
        } else if (Math.abs(dragElementCenter.x - line.pos) < tolerance) {
          lines.push({
            type: 'vertical',
            position: line.pos * canvasScale + canvasOffsetX,
            start: 0,
            end: 540 * canvasScale,
            color: '#EF4444',
          });
        } else if (Math.abs(draggingElement.x + draggingElement.width - line.pos) < tolerance) {
          lines.push({
            type: 'vertical',
            position: line.pos * canvasScale + canvasOffsetX,
            start: 0,
            end: 540 * canvasScale,
            color: '#EF4444',
          });
        }
      } else {
        // 检查上边缘、中心、下边缘对齐
        if (Math.abs(draggingElement.y - line.pos) < tolerance) {
          lines.push({
            type: 'horizontal',
            position: line.pos * canvasScale + canvasOffsetY,
            start: 0,
            end: 960 * canvasScale,
            color: '#EF4444',
          });
        } else if (Math.abs(dragElementCenter.y - line.pos) < tolerance) {
          lines.push({
            type: 'horizontal',
            position: line.pos * canvasScale + canvasOffsetY,
            start: 0,
            end: 960 * canvasScale,
            color: '#EF4444',
          });
        } else if (Math.abs(draggingElement.y + draggingElement.height - line.pos) < tolerance) {
          lines.push({
            type: 'horizontal',
            position: line.pos * canvasScale + canvasOffsetY,
            start: 0,
            end: 960 * canvasScale,
            color: '#EF4444',
          });
        }
      }
    });
    
    // 检查与其他元素的对齐
    currentSlide.elements.forEach(element => {
      if (element.id === draggingElement.id) return;
      
      const elementCenter = {
        x: element.x + element.width / 2,
        y: element.y + element.height / 2,
      };
      
      const dragElementCenter = {
        x: draggingElement.x + draggingElement.width / 2,
        y: draggingElement.y + draggingElement.height / 2,
      };
      
      // 垂直对齐检查
      // 左边缘对齐
      if (Math.abs(draggingElement.x - element.x) < tolerance) {
        lines.push({
          type: 'vertical',
          position: element.x * canvasScale + canvasOffsetX,
          start: Math.min(element.y, draggingElement.y) * canvasScale + canvasOffsetY,
          end: Math.max(element.y + element.height, draggingElement.y + draggingElement.height) * canvasScale + canvasOffsetY,
          color: '#10B981',
        });
      }
      
      // 右边缘对齐
      if (Math.abs(draggingElement.x + draggingElement.width - (element.x + element.width)) < tolerance) {
        lines.push({
          type: 'vertical',
          position: (element.x + element.width) * canvasScale + canvasOffsetX,
          start: Math.min(element.y, draggingElement.y) * canvasScale + canvasOffsetY,
          end: Math.max(element.y + element.height, draggingElement.y + draggingElement.height) * canvasScale + canvasOffsetY,
          color: '#10B981',
        });
      }
      
      // 中心对齐
      if (Math.abs(dragElementCenter.x - elementCenter.x) < tolerance) {
        lines.push({
          type: 'vertical',
          position: elementCenter.x * canvasScale + canvasOffsetX,
          start: Math.min(element.y, draggingElement.y) * canvasScale + canvasOffsetY,
          end: Math.max(element.y + element.height, draggingElement.y + draggingElement.height) * canvasScale + canvasOffsetY,
          color: '#8B5CF6',
        });
      }
      
      // 水平对齐检查
      // 上边缘对齐
      if (Math.abs(draggingElement.y - element.y) < tolerance) {
        lines.push({
          type: 'horizontal',
          position: element.y * canvasScale + canvasOffsetY,
          start: Math.min(element.x, draggingElement.x) * canvasScale + canvasOffsetX,
          end: Math.max(element.x + element.width, draggingElement.x + draggingElement.width) * canvasScale + canvasOffsetX,
          color: '#10B981',
        });
      }
      
      // 下边缘对齐
      if (Math.abs(draggingElement.y + draggingElement.height - (element.y + element.height)) < tolerance) {
        lines.push({
          type: 'horizontal',
          position: (element.y + element.height) * canvasScale + canvasOffsetY,
          start: Math.min(element.x, draggingElement.x) * canvasScale + canvasOffsetX,
          end: Math.max(element.x + element.width, draggingElement.x + draggingElement.width) * canvasScale + canvasOffsetX,
          color: '#10B981',
        });
      }
      
      // 中心对齐
      if (Math.abs(dragElementCenter.y - elementCenter.y) < tolerance) {
        lines.push({
          type: 'horizontal',
          position: elementCenter.y * canvasScale + canvasOffsetY,
          start: Math.min(element.x, draggingElement.x) * canvasScale + canvasOffsetX,
          end: Math.max(element.x + element.width, draggingElement.x + draggingElement.width) * canvasScale + canvasOffsetX,
          color: '#8B5CF6',
        });
      }
    });
    
    return lines;
  };
  
  const alignmentLines = getAlignmentLines();
  
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: Z_INDEX.ALIGNMENT_LINES }}>
      {alignmentLines.map((line, index) => (
        <div
          key={index}
          className="absolute"
          style={{
            backgroundColor: line.color,
            ...(line.type === 'vertical' 
              ? {
                  left: line.position,
                  top: line.start,
                  width: 1,
                  height: line.end - line.start,
                } 
              : {
                  left: line.start,
                  top: line.position,
                  width: line.end - line.start,
                  height: 1,
                }
            ),
            boxShadow: `0 0 4px ${line.color}`,
            opacity: 0.8,
          }}
        />
      ))}
    </div>
  );
}