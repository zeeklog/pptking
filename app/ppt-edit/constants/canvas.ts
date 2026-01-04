/**
 * PPT编辑器画布配置常量
 * 
 * 定义了编辑器中使用的各种画布尺寸、比例和相关配置
 */

// 标准PPT尺寸选项
export const PPT_SIZES = {
  // 标准宽屏 (16:9)
  WIDESCREEN: {
    name: '宽屏 16:9',
    width: 960,
    height: 540,
    ratio: 16/9,
    description: '现代演示文稿标准格式，适合大多数显示器'
  },
  
  // 传统 4:3
  STANDARD: {
    name: '标准 4:3', 
    width: 960,
    height: 720,
    ratio: 4/3,
    description: '传统演示文稿格式，适合方形屏幕'
  },
  
  // A4 纸张比例
  A4: {
    name: 'A4 纸张',
    width: 794,
    height: 1123,
    ratio: Math.sqrt(2),
    description: '适合打印的A4纸张比例'
  },
  
  // 自定义尺寸
  CUSTOM: {
    name: '自定义',
    width: 960,
    height: 540,
    ratio: 16/9,
    description: '用户自定义尺寸'
  }
} as const;

// 默认画布配置
export const DEFAULT_CANVAS_CONFIG = {
  size: PPT_SIZES.WIDESCREEN,
  minScale: 0.1,
  maxScale: 5.0,
  defaultScale: 1.0,
  gridSize: 20,
  snapTolerance: 10,
  
  // 导出尺寸配置
  export: {
    // 高清导出 (2x)
    hd: {
      width: 1920,
      height: 1080,
      scale: 2
    },
    // 超高清导出 (4x) 
    uhd: {
      width: 3840,
      height: 2160,
      scale: 4
    },
    // 打印质量 (300 DPI)
    print: {
      width: 2835, // 960 * 2.95 (300/102 DPI转换)
      height: 1594, // 540 * 2.95
      scale: 2.95
    }
  }
} as const;

// 画布尺寸类型
export type PPTSize = typeof PPT_SIZES[keyof typeof PPT_SIZES];
export type CanvasConfig = typeof DEFAULT_CANVAS_CONFIG;

// 获取当前画布配置 (从store获取，默认使用宽屏)
export function getCurrentCanvasSize(): PPTSize {
  // 这里需要在运行时获取store状态，避免循环依赖
  // 在实际使用中，应该通过参数传入或者使用hook
  if (typeof window !== 'undefined' && (window as any).__PPT_STORE__) {
    return (window as any).__PPT_STORE__.canvasSize || PPT_SIZES.WIDESCREEN;
  }
  return PPT_SIZES.WIDESCREEN;
}

// 获取画布的实际尺寸
export function getCanvasDimensions(canvasSize?: PPTSize) {
  const size = canvasSize || getCurrentCanvasSize();
  return {
    width: size.width,
    height: size.height,
    ratio: size.ratio
  };
}

// 计算缩放比例，将源尺寸缩放到目标画布尺寸
export function calculateScaleFactors(sourceWidth: number, sourceHeight: number, targetSize?: PPTSize) {
  const target = targetSize || getCurrentCanvasSize();
  
  return {
    scaleX: target.width / sourceWidth,
    scaleY: target.height / sourceHeight,
    uniformScale: Math.min(target.width / sourceWidth, target.height / sourceHeight)
  };
}

// 检查尺寸是否在画布范围内
export function isWithinCanvas(x: number, y: number, width: number, height: number, canvasSize?: PPTSize) {
  const canvas = canvasSize || getCurrentCanvasSize();
  return x >= 0 && y >= 0 && 
         (x + width) <= canvas.width && 
         (y + height) <= canvas.height;
}

// 将元素约束在画布范围内
export function constrainToCanvas(x: number, y: number, width: number, height: number, canvasSize?: PPTSize) {
  const canvas = canvasSize || getCurrentCanvasSize();
  
  return {
    x: Math.max(0, Math.min(x, canvas.width - width)),
    y: Math.max(0, Math.min(y, canvas.height - height)),
    width: Math.min(width, canvas.width),
    height: Math.min(height, canvas.height)
  };
}

// 居中对齐辅助函数
export function getCenterPosition(elementWidth: number, elementHeight: number, canvasSize?: PPTSize) {
  const canvas = canvasSize || getCurrentCanvasSize();
  
  return {
    x: (canvas.width - elementWidth) / 2,
    y: (canvas.height - elementHeight) / 2
  };
}

// 获取对齐位置
export function getAlignmentPosition(
  alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom',
  elementWidth: number, 
  elementHeight: number,
  canvasSize?: PPTSize
) {
  const canvas = canvasSize || getCurrentCanvasSize();
  let x = 0, y = 0;
  
  switch (alignment) {
    case 'left':
      x = 0;
      break;
    case 'center':
      x = (canvas.width - elementWidth) / 2;
      break;
    case 'right':
      x = canvas.width - elementWidth;
      break;
    case 'top':
      y = 0;
      break;
    case 'middle':
      y = (canvas.height - elementHeight) / 2;
      break;
    case 'bottom':
      y = canvas.height - elementHeight;
      break;
  }
  
  return { x, y };
}
