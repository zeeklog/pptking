import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { mapShapeType as mapPPTXShapeType, isPathShape } from '../utils/shape-type-mapper';
import { BUILT_IN_THEMES } from '../data/themes';
import { BUILT_IN_TEMPLATES } from '../data/templates';
import { exportService } from '../services/export-service';
import { getCanvasDimensions, calculateScaleFactors, constrainToCanvas, getAlignmentPosition, PPT_SIZES, type PPTSize } from '../constants/canvas';
// 动态导入存储管理器，避免服务端渲染问题
let storageManager: any = null;
let resourceManager: any = null;

async function getStorageManager() {
  if (typeof window === 'undefined') {
    // 服务端渲染时返回模拟对象
    return {
      save: async () => { console.log('服务端环境，跳过保存'); },
      load: async () => { console.log('服务端环境，跳过加载'); return null; },
      clear: async () => { console.log('服务端环境，跳过清除'); },
      getStorageInfo: async () => ({ totalSize: 0, usedSpace: 0, availableSpace: 0, itemCount: 0 }),
    };
  }

  if (!storageManager) {
    const { storageManager: sm } = await import('./storage-manager');
    storageManager = sm;
  }
  return storageManager;
}

async function getResourceManager() {
  if (typeof window === 'undefined') {
    // 服务端渲染时返回模拟对象
    return {
      addResource: async () => '',
      getResource: async () => null,
      addReference: async () => {},
      removeReference: async () => {},
      updateReference: async () => {},
      cleanupUnusedResources: async () => {},
    };
  }

  if (!resourceManager) {
    const { resourceManager: rm } = await import('./resource-manager');
    resourceManager = rm;
  }
  return resourceManager;
}
// 动态导入idb，避免服务端渲染问题
// 注意：这些库需要在package.json中安装
// import { toPng } from 'html-to-image';
// import { jsPDF } from 'jspdf';
// import JSZip from 'jszip';
import { parse } from '../../../lib/pptxtojson/src/pptxtojson.js'

// 自动保存配置
const AUTO_SAVE_CONFIG = {
  enabled: true,
  interval: 60000, // 60秒定时保存
  throttleDelay: 0, // 禁用防抖保存
  maxRetries: 3,
  enableDebouncedSave: false, // 禁用状态变更时的自动保存
};

// 保存状态管理
let saveTimeout: NodeJS.Timeout | null = null;
let isSaving = false;
let saveRetryCount = 0;
let autoSaveInterval: NodeJS.Timeout | null = null;

// 手动保存状态到存储
async function saveStateToStorage(state: PPTState): Promise<void> {
  // 检查浏览器环境
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    console.log('服务端环境，跳过保存操作');
    return;
  }

  if (isSaving) {
    console.log('⏳ 正在保存中，跳过本次保存');
    return;
  }

  isSaving = true;
  try {
    const sm = await getStorageManager();
    await sm.save(state);
    saveRetryCount = 0;
    console.log('✅ 状态保存成功');
  } catch (error) {
    saveRetryCount++;
    console.error(`❌ 状态保存失败 (重试 ${saveRetryCount}/${AUTO_SAVE_CONFIG.maxRetries}):`, error);

    if (saveRetryCount < AUTO_SAVE_CONFIG.maxRetries) {
      // 指数退避重试
      const retryDelay = Math.min(1000 * Math.pow(2, saveRetryCount), 10000);
      setTimeout(() => {
        saveStateToStorage(state);
      }, retryDelay);
    } else {
      console.error('❌ 达到最大重试次数，保存失败');
      saveRetryCount = 0; // 重置重试计数
    }
  } finally {
    isSaving = false;
  }
}

// 资源管理辅助方法
async function processElementResourcesForAdd(element: PPTElement, slideIndex: number): Promise<PPTElement> {
  const rm = await getResourceManager();
  const processedElement = JSON.parse(JSON.stringify(element)); // 深拷贝

  // 处理图片元素
  if (element.type === 'image' && element.image?.src && !element.image.src.startsWith('resource_')) {
    try {
      const resourceId = await rm.addResource(
        element.image.src,
        'image',
        'image/jpeg', // 可以从base64头部解析实际类型
        element.image.alt || `element_${element.id}`
      );
      await rm.addReference(resourceId, element.id, slideIndex);
      processedElement.image.src = resourceId;
    } catch (error) {
      console.warn('处理图片资源失败，使用原始数据:', error);
    }
  }

  // 处理视频元素
  if (element.type === 'video' && element.video?.src && !element.video.src.startsWith('resource_')) {
    try {
      const resourceId = await rm.addResource(
        element.video.src,
        'video',
        'video/mp4',
        `video_${element.id}`
      );
      await rm.addReference(resourceId, element.id, slideIndex);
      processedElement.video.src = resourceId;
    } catch (error) {
      console.warn('处理视频资源失败，使用原始数据:', error);
    }
  }

  // 处理音频元素
  if (element.type === 'audio' && element.audio?.src && !element.audio.src.startsWith('resource_')) {
    try {
      const resourceId = await rm.addResource(
        element.audio.src,
        'audio',
        'audio/mp3',
        `audio_${element.id}`
      );
      await rm.addReference(resourceId, element.id, slideIndex);
      processedElement.audio.src = resourceId;
    } catch (error) {
      console.warn('处理音频资源失败，使用原始数据:', error);
    }
  }

  return processedElement;
}

async function handleResourceUpdate(elementId: string, oldElement: PPTElement, newElement: PPTElement, slideIndex: number): Promise<void> {
  const rm = await getResourceManager();

  // 检查图片资源变化
  if (oldElement.type === 'image' && newElement.type === 'image') {
    const oldSrc = oldElement.image?.src;
    const newSrc = newElement.image?.src;
    
    if (oldSrc !== newSrc) {
      // 移除旧资源引用
      if (oldSrc && oldSrc.startsWith('resource_')) {
        await rm.removeReference(oldSrc, elementId);
      }
      
      // 添加新资源
      if (newSrc && !newSrc.startsWith('resource_')) {
        try {
          const resourceId = await rm.addResource(
            newSrc,
            'image',
            'image/jpeg',
            newElement.image?.alt || `element_${elementId}`
          );
          await rm.addReference(resourceId, elementId, slideIndex);
          newElement.image.src = resourceId;
        } catch (error) {
          console.warn('处理新图片资源失败:', error);
        }
      }
    }
  }

  // 检查视频资源变化
  if (oldElement.type === 'video' && newElement.type === 'video') {
    const oldSrc = oldElement.video?.src;
    const newSrc = newElement.video?.src;
    
    if (oldSrc !== newSrc) {
      if (oldSrc && oldSrc.startsWith('resource_')) {
        await rm.removeReference(oldSrc, elementId);
      }
      
      if (newSrc && !newSrc.startsWith('resource_')) {
        try {
          const resourceId = await rm.addResource(newSrc, 'video', 'video/mp4', `video_${elementId}`);
          await rm.addReference(resourceId, elementId, slideIndex);
          newElement.video.src = resourceId;
        } catch (error) {
          console.warn('处理新视频资源失败:', error);
        }
      }
    }
  }

  // 检查音频资源变化
  if (oldElement.type === 'audio' && newElement.type === 'audio') {
    const oldSrc = oldElement.audio?.src;
    const newSrc = newElement.audio?.src;
    
    if (oldSrc !== newSrc) {
      if (oldSrc && oldSrc.startsWith('resource_')) {
        await rm.removeReference(oldSrc, elementId);
      }
      
      if (newSrc && !newSrc.startsWith('resource_')) {
        try {
          const resourceId = await rm.addResource(newSrc, 'audio', 'audio/mp3', `audio_${elementId}`);
          await rm.addReference(resourceId, elementId, slideIndex);
          newElement.audio.src = resourceId;
        } catch (error) {
          console.warn('处理新音频资源失败:', error);
        }
      }
    }
  }
}

async function handleResourceDelete(element: PPTElement): Promise<void> {
  const rm = await getResourceManager();

  // 处理图片资源
  if (element.type === 'image' && element.image?.src?.startsWith('resource_')) {
    await rm.removeReference(element.image.src, element.id);
  }

  // 处理视频资源
  if (element.type === 'video' && element.video?.src?.startsWith('resource_')) {
    await rm.removeReference(element.video.src, element.id);
  }

  // 处理音频资源
  if (element.type === 'audio' && element.audio?.src?.startsWith('resource_')) {
    await rm.removeReference(element.audio.src, element.id);
  }

  // 处理组合元素中的资源
  if (element.type === 'group' && element.groupedElements) {
    for (const groupedElement of element.groupedElements) {
      await handleResourceDelete(groupedElement);
    }
  }
}

// 防抖保存（现在受配置控制）
function debouncedSave(state: PPTState): void {
  // 检查是否启用防抖保存
  if (!AUTO_SAVE_CONFIG.enableDebouncedSave) {
    return;
  }

  // 检查浏览器环境
  if (typeof window === 'undefined') {
    return;
  }

  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  if (AUTO_SAVE_CONFIG.throttleDelay > 0) {
    saveTimeout = setTimeout(() => {
      saveStateToStorage(state);
    }, AUTO_SAVE_CONFIG.throttleDelay);
  }
}

// 从存储加载状态
async function loadStateFromStorage(): Promise<Partial<PPTState> | null> {
  // 检查浏览器环境
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    console.log('服务端环境，跳过加载操作');
    return null;
  }

  try {
    const sm = await getStorageManager();
    const loadedState = await sm.load();
    if (loadedState) {
      console.log('✅ 状态加载成功');
      return loadedState;
    }
    return null;
  } catch (error) {
    console.error('❌ 状态加载失败:', error);
    return null;
  }
}

// 启动自动保存
function startAutoSave(getState: () => PPTState): void {
  // 检查浏览器环境
  if (typeof window === 'undefined') {
    console.log('服务端环境，跳过自动保存启动');
    return;
  }

  if (!AUTO_SAVE_CONFIG.enabled || autoSaveInterval) {
    return;
  }

  // autoSaveInterval = setInterval(() => {
  //   const state = getState();
  //   if (state.slides.length > 0) {
  //     console.log('🔄 自动保存触发');
  //     saveStateToStorage(state);
  //   }
  // }, AUTO_SAVE_CONFIG.interval);

  // console.log(`🚀 自动保存已启动，间隔 ${AUTO_SAVE_CONFIG.interval / 1000} 秒`);
}

// 停止自动保存
function stopAutoSave(): void {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
    console.log('⏹️ 自动保存已停止');
  }
}

// 元素类型定义
export interface PPTElement {
  id: string;
  /**
   * 关于元素类型的强制规则：
   * 1、group可以组合下述所有的类型：'text' | 'image' | 'shape' | 'line' | 'chart' | 'table' | 'latex' | 'video' | 'audio'
   * 2、Group和Group的组合， 直接合并Group下所有的元素， 所以Group下面不会有Group， 但是会有其所有类型的元素
   * **/
  type: 'text' | 'image' | 'shape' | 'line' | 'chart' | 'table' | 'latex' | 'video' | 'audio' | 'group';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  hidden: boolean;
  zIndex: number;
  name?: string;

  // 组合相关属性
  isGroup?: boolean;
  groupedElements?: PPTElement[]; // 组合包含的元素

  // Group类型专用属性（兼容导入数据格式）
  elements?: any[]; // 用于兼容外部导入数据的elements字段
  isFlipV?: boolean;
  isFlipH?: boolean;
  order?: number;

  // 文本元素属性
  text?: {
    content: string;
    fontSize: number;
    fontFamily: string;
    color: string;
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strikethrough: boolean;
    align: 'left' | 'center' | 'right' | 'justify';
    lineHeight: number;
    letterSpacing: number;
  };

  // 图片元素属性
  image?: {
    src: string;
    alt: string;
    filters: {
      blur: number;
      brightness: number;
      contrast: number;
      grayscale: number;
      saturate: number;
      hue: number;
    };
    borderRadius: number;
    clipPath?: string;
  };

  // 形状元素属性
  shape?: {
    type: 'rectangle' | 'circle' | 'triangle' | 'diamond' | 'star' | 'custom';
    fill: string;
    stroke: string;
    strokeWidth: number;
    borderRadius?: number; // 圆角半径，支持圆角矩形
    gradient?: {
      type: 'linear' | 'radial';
      colors: { pos: string; color: string; }[]; // 支持多色渐变点
      angle?: number; // 渐变角度
      rot?: number; // 旋转角度 (PPTX 格式)  
      path?: string; // 渐变路径类型
    };
    path?: string; // 自定义形状路径（SVG路径）
    shapType?: string; // 原始形状类型标识符
    isPathShape?: boolean; // 是否为路径形状
    shadow?: {
      h: number; // 水平偏移
      v: number; // 垂直偏移
      blur: number; // 模糊半径
      color: string; // 阴影颜色
    };
    isFlipH?: boolean; // 水平翻转
    isFlipV?: boolean; // 垂直翻转
    text?: {
      content: string;
      fontSize: number;
      fontFamily: string;
      color: string;
      bold: boolean;
      italic: boolean;
      underline: boolean;
      strikethrough: boolean;
      align: 'left' | 'center' | 'right';
      verticalAlign: 'top' | 'middle' | 'bottom';
      lineHeight: number;
      letterSpacing: number;
    };
  };

  // 线条元素属性
  line?: {
    type: 'straight' | 'curve' | 'polyline';
    stroke: string;
    strokeWidth: number;
    strokeDasharray?: string;
    startMarker?: 'none' | 'arrow' | 'circle';
    endMarker?: 'none' | 'arrow' | 'circle';
    points: { x: number; y: number }[];
  };

  // 图表元素属性
  chart?: {
    type: 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'radar';
    data: any[];
    theme: string;
    options: any;
  };

  // 表格元素属性
  table?: {
    rows: number;
    cols: number;
    data: any[][]; // 支持复杂的单元格数据
    rowHeights?: number[]; // 行高数组
    colWidths?: number[]; // 列宽数组
    cellStyle: {
      fontSize: number;
      color: string;
      backgroundColor: string;
      align: 'left' | 'center' | 'right';
      bold: boolean;
      italic: boolean;
    };
    headerStyle?: any;
    borderStyle: {
      width: number;
      color: string;
      style: 'solid' | 'dashed' | 'dotted';
    };
  };

  // LaTeX元素属性
  latex?: {
    formula: string;
    color: string;
    size: number;
  };

  // 视频元素属性
  video?: {
    src: string;
    autoplay: boolean;
    loop: boolean;
    controls: boolean;
    poster?: string; // 视频封面
    volume?: number;
  };

  // 音频元素属性
  audio?: {
    src: string;
    autoplay: boolean;
    loop: boolean;
    controls: boolean;
    volume?: number;
  };

  // 媒体元素属性（向后兼容）
  media?: {
    src: string;
    autoplay: boolean;
    loop: boolean;
    controls: boolean;
    poster?: string; // 视频封面
  };

  // 动画属性
  animation?: {
    entrance?: {
      type: string;
      duration: number;
      delay: number;
      trigger: 'click' | 'auto' | 'with-previous';
    };
    exit?: {
      type: string;
      duration: number;
      delay: number;
      trigger: 'click' | 'auto' | 'with-previous';
    };
    emphasis?: {
      type: string;
      duration: number;
      delay: number;
      trigger: 'click' | 'auto' | 'with-previous';
    };
  };

  // 超链接属性
  link?: {
    type: 'url' | 'slide';
    url?: string;
    slideIndex?: number;
  };
}

// 幻灯片定义
export interface PPTSlide {
  id: string;
  title: string;
  elements: PPTElement[];
  background: {
    type: 'color' | 'image' | 'gradient';
    value: string;
    image?: string; // 背景图片URL或base64
    imageSize?: 'cover' | 'contain' | 'repeat';
    opacity?: number; // 背景透明度，用于图片背景
    gradient?: {
      type: 'linear' | 'radial';
      colors: string[];
      angle: number;
    };
  };
  transition: {
    type: 'none' | 'fade' | 'slide' | 'zoom' | 'rotate3d' | 'cube' | 'flip' | 'push' | 'reveal' | 'wipe';
    duration: number;
    direction?: 'left' | 'right' | 'up' | 'down';
  };
  notes: string; // 演讲者备注
  tags: string[]; // 页面标签
}

// 主题定义
export interface PPTTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    border: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  shadows: {
    small: string;
    medium: string;
    large: string;
  };
}

// 模板定义
export interface PPTTemplate {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  slides: Partial<PPTSlide>[];
  theme: PPTTheme;
  tags: string[];
}

// 历史记录
export interface HistorySnapshot {
  id: string;
  timestamp: number;
  slides: PPTSlide[];
  activeSlideIndex: number;
  description: string;
}

// 主状态接口
export interface PPTState {
  // 基础信息
  title: string;
  slides: PPTSlide[];
  activeSlideIndex: number;

  // 选择状态
  activeElementIds: string[];
  handleElementId: string;
  activeGroupElementId: string;
  hiddenElementIds: string[];

  // 画布状态
  canvasScale: number;
  canvasOffsetX: number;
  canvasOffsetY: number;
  showGrid: boolean;
  showRuler: boolean;
  gridSize: number;

  // 界面状态
  thumbnailsWidth: number;
  toolbarWidth: number;
  remarkHeight: number;
  showThumbnails: boolean;
  showToolbar: boolean;
  showRemark: boolean;
  isFullscreen: boolean;

  // 画布配置
  canvasSize: PPTSize;

  // 编辑状态
  isEditing: boolean;
  editingElementId: string | null;
  creatingElement: {
    type: PPTElement['type'] | null;
    isCreating: boolean;
  };

  // 工具状态
  selectedTool: 'select' | 'text' | 'shape' | 'line' | 'image' | 'chart' | 'table' | 'latex' | 'media';
  toolbarActivePanel: 'style' | 'position' | 'animation' | 'design' | 'slide-animation' | 'multi-position' | 'multi-style';

  // 主题和模板
  currentTheme: PPTTheme;
  availableThemes: PPTTheme[];
  availableTemplates: PPTTemplate[];

  // 历史记录
  historySnapshots: HistorySnapshot[];
  currentSnapshotIndex: number;

  // 格式刷
  formatPainter: {
    isActive: boolean;
    sourceElementId: string | null;
    type: 'text' | 'shape' | null;
  };

  // 剪贴板
  clipboard: {
    elements: PPTElement[];
    slides: PPTSlide[];
  };

  // 导出状态
  exportProgress: {
    isExporting: boolean;
    progress: number;
    type: 'pptx' | 'pdf' | 'image' | 'json' | null;
  };
}

// 操作接口
export interface PPTActions {
  // 基础操作
  initializeStore: () => Promise<void>;
  setTitle: (title: string) => void;
  createNewPPT: () => void;

  // 幻灯片操作
  addSlide: (template?: Partial<PPTSlide>) => void;
  deleteSlide: (index: number) => Promise<void>;
  duplicateSlide: (index: number) => void;
  moveSlide: (fromIndex: number, toIndex: number) => void;
  setActiveSlide: (index: number) => void;
  updateSlideBackground: (index: number, background: PPTSlide['background']) => void;
  updateSlideTransition: (index: number, transition: PPTSlide['transition']) => void;
  updateSlideNotes: (index: number, notes: string) => void;
  updateSlideTitle: (index: number, title: string) => void;

  // 元素操作
  addElement: (element: Omit<PPTElement, 'id'>) => Promise<void>;
  updateElement: (elementId: string, updates: Partial<PPTElement>, createSnapshot?: boolean) => Promise<void>;
  updateElementBatch: (updates: Array<{ elementId: string; updates: Partial<PPTElement> }>, description?: string) => void;
  deleteElement: (elementId: string) => Promise<void>;
  duplicateElement: (elementId: string) => Promise<void>;
  selectElements: (elementIds: string[]) => void;
  clearSelection: () => void;
  groupElements: (elementIds: string[]) => void;
  ungroupElements: (groupId: string) => void;
  lockElement: (elementId: string) => void;
  unlockElement: (elementId: string) => void;
  hideElement: (elementId: string) => void;
  showElement: (elementId: string) => void;
  bringToFront: (elementId: string) => void;
  sendToBack: (elementId: string) => void;
  bringForward: (elementId: string) => void;
  sendBackward: (elementId: string) => void;

  // 对齐操作
  alignElements: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom', elementIds: string[]) => void;
  distributeElements: (direction: 'horizontal' | 'vertical', elementIds: string[]) => void;

  // 画布操作
  setCanvasScale: (scale: number) => void;
  setCanvasOffset: (x: number, y: number) => void;
  toggleGrid: () => void;
  toggleRuler: () => void;
  setGridSize: (size: number) => void;
  resetCanvas: () => void;
  setCanvasSize: (size: PPTSize) => void;

  // 界面操作
  toggleThumbnails: () => void;
  toggleToolbar: () => void;
  toggleRemark: () => void;
  setThumbnailsWidth: (width: number) => void;
  setToolbarWidth: (width: number) => void;
  setRemarkHeight: (height: number) => void;
  toggleFullscreen: () => void;

  // 工具操作
  setSelectedTool: (tool: PPTState['selectedTool']) => void;
  setToolbarActivePanel: (panel: PPTState['toolbarActivePanel']) => void;
  setCreatingElement: (type: PPTElement['type'] | null) => void;

  // 编辑操作
  startEditing: (elementId: string) => void;
  stopEditing: () => void;

  // 主题和模板
  applyTheme: (theme: PPTTheme) => void;
  applyTemplate: (template: PPTTemplate) => void;

  // 历史记录
  createSnapshot: (description: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  getMaxSnapshots: () => number;

  // 格式刷
  startFormatPainter: (elementId: string, type: 'text' | 'shape') => void;
  applyFormatPainter: (targetElementId: string) => void;
  stopFormatPainter: () => void;

  // 剪贴板操作
  copyElements: (elementIds: string[]) => void;
  cutElements: (elementIds: string[]) => Promise<void>;
  pasteElements: () => void;
  copySlides: (slideIndices: number[]) => void;
  pasteSlides: () => void;

  // 导出功能
  exportToPPTX: () => Promise<void>;
  exportToPDF: () => Promise<void>;
  exportToImages: () => Promise<void>;
  exportToJSON: () => Promise<void>;

  // 导入功能
  importFromPPTX: (file: File) => Promise<void>;
  importFromJSON: (data: any) => Promise<void>;

  // 打印功能
  printSlides: (layout: 'slides' | 'handouts' | 'notes', slidesPerPage?: number) => Promise<void>;

  // 调试功能
  debugState: () => void;
  manualRestoreFromIndexedDB: () => Promise<void>;
  debugElementZIndex: () => void;

  // 手动保存功能
  saveCurrentState: () => Promise<void>;
  enableAutoSave: () => void;
  disableAutoSave: () => void;

  // 资源管理功能
  addImageFromFile: (file: File, elementProperties?: Partial<PPTElement>) => Promise<void>;
  addImageFromUrl: (url: string, elementProperties?: Partial<PPTElement>) => Promise<void>;
  replaceElementImage: (elementId: string, newImageSrc: string) => Promise<void>;
  getResourceStorageStats: () => Promise<any>;

  // 导入功能辅助方法
  parseHTMLContent: (htmlContent: string) => {
    content: string;
    fontSize: number;
    fontFamily: string;
    color: string;
    bold: boolean;
    italic: boolean;
    align: 'left' | 'center' | 'right' | 'justify';
    lineCount: number;
  };
  mapElementType: (type: string) => PPTElement['type'];
  mapShapeType: (type: string) => 'rectangle' | 'circle' | 'triangle' | 'diamond' | 'star' | 'custom';
  convertCoordinate: (value: any) => number;
  convertSize: (value: any) => number;
  convertFontSize: (value: any) => number;
  convertColor: (value: any) => string;
  rgbToHex: (rgb: string) => string;
  convertAlign: (value: any) => 'left' | 'center' | 'right' | 'justify';
  extractColorFromFill: (fill: any) => string;
  mapChartType: (chartType: string) => 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'radar';
  calculateElementZIndex: (elementType: string, index: number) => number;
}

// 默认主题
const DEFAULT_THEME: PPTTheme = BUILT_IN_THEMES[0];

// 创建空白幻灯片
const createEmptySlide = (): PPTSlide => ({
  id: nanoid(),
  title: '新建幻灯片',
  elements: [],
  background: {
    type: 'color',
    value: '#FFFFFF',
  },
  transition: {
    type: 'none',
    duration: 500,
  },
  notes: '',
  tags: [],
});

// 默认状态
const DEFAULT_STATE: PPTState = {
  title: '未命名演示文稿',
  slides: [createEmptySlide()],
  activeSlideIndex: 0,

  activeElementIds: [],
  handleElementId: '',
  activeGroupElementId: '',
  hiddenElementIds: [],

  canvasScale: 1,
  canvasOffsetX: 0,
  canvasOffsetY: 0,
  showGrid: false,
  showRuler: true,
  gridSize: 20,

  thumbnailsWidth: 240,
  toolbarWidth: 320,
  remarkHeight: 120,
  showThumbnails: true,
  showToolbar: true,
  showRemark: false,
  isFullscreen: false,

  // 画布配置
  canvasSize: PPT_SIZES.WIDESCREEN,

  isEditing: false,
  editingElementId: null,
  creatingElement: {
    type: null,
    isCreating: false,
  },

  selectedTool: 'select',
  toolbarActivePanel: 'style',

  currentTheme: DEFAULT_THEME,
  availableThemes: BUILT_IN_THEMES,
  availableTemplates: BUILT_IN_TEMPLATES,

  historySnapshots: [],
  currentSnapshotIndex: -1,

  formatPainter: {
    isActive: false,
    sourceElementId: null,
    type: null,
  },

  clipboard: {
    elements: [],
    slides: [],
  },

  exportProgress: {
    isExporting: false,
    progress: 0,
    type: null,
  },
};

export const usePPTStore = create<PPTState & PPTActions>()(
  subscribeWithSelector((set, get) => ({
    ...DEFAULT_STATE,

    // 基础操作
    async initializeStore() {
      console.log('🚀 开始初始化PPT Store...');

      try {
        // 从存储加载状态
        const loadedState = await loadStateFromStorage();

        if (loadedState) {
          console.log('📂 发现存储的状态数据');

          // 验证加载的数据
          const validSlides = (loadedState.slides || []).filter(slide =>
            slide &&
            typeof slide === 'object' &&
            slide.id &&
            slide.title !== undefined &&
            Array.isArray(slide.elements)
          );

          console.log(`数据验证结果: 原始${loadedState.slides?.length || 0}个幻灯片，有效${validSlides.length}个幻灯片`);

          if (validSlides.length > 0) {
            // 恢复有效状态
            const safeActiveSlideIndex = (loadedState.activeSlideIndex && loadedState.activeSlideIndex < validSlides.length) ?
              loadedState.activeSlideIndex : 0;

            set({
              ...loadedState,
              slides: validSlides,
              activeSlideIndex: safeActiveSlideIndex,
              // 清理运行时状态
              activeElementIds: [],
              isEditing: false,
              editingElementId: null,
              historySnapshots: [],
              currentSnapshotIndex: -1,
            });

            console.log(`✅ 成功恢复${validSlides.length}个幻灯片`);

            // 启动自动保存
            startAutoSave(get);
            return;
          }
        }

        // 没有有效数据，创建默认状态
        console.log('🆕 创建默认空白幻灯片');
        const newSlide = createEmptySlide();
        set({
          slides: [newSlide],
          activeSlideIndex: 0,
          historySnapshots: [],
          currentSnapshotIndex: -1,
        });

        // 启动自动保存
        startAutoSave(get);

        // 延迟保存初始状态
        setTimeout(() => {
          try {
            const state = get();
            saveStateToStorage(state);
            console.log('💾 初始状态已保存');
          } catch (error) {
            console.warn('初始状态保存失败:', error);
          }
        }, 1000);

      } catch (error) {
        console.error('❌ Store初始化失败:', error);

        // 出错时创建默认状态
        const newSlide = createEmptySlide();
        set({
          slides: [newSlide],
          activeSlideIndex: 0,
          historySnapshots: [],
          currentSnapshotIndex: -1,
        });
      }
    },

      setTitle(title: string) {
        set({ title });
        get().createSnapshot('修改标题');
      },

      createNewPPT() {
        const newSlide = createEmptySlide();
        set({
          title: '未命名演示文稿',
          slides: [newSlide],
          activeSlideIndex: 0,
          activeElementIds: [],
          handleElementId: '',
          activeGroupElementId: '',
          hiddenElementIds: [],
          canvasScale: 1,
          canvasOffsetX: 0,
          canvasOffsetY: 0,
          currentTheme: DEFAULT_THEME,
          historySnapshots: [],
          currentSnapshotIndex: -1,
          exportProgress: {
            isExporting: false,
            progress: 0,
            type: null,
          },
        });
        console.log('🆕 已创建新演示文稿');
      },

      // 幻灯片操作
      addSlide(template?: Partial<PPTSlide>) {
        const newSlide = template ? { ...createEmptySlide(), ...template } : createEmptySlide();
        const state = get();
        const newSlides = [...state.slides];
        newSlides.splice(state.activeSlideIndex + 1, 0, newSlide);

        set({
          slides: newSlides,
          activeSlideIndex: state.activeSlideIndex + 1,
        });

        get().createSnapshot('添加幻灯片');
      },

      async deleteSlide(index: number) {
        const state = get();
        if (state.slides.length <= 1) return; // 至少保留一张幻灯片

        const slideToDelete = state.slides[index];
        
        // 清理幻灯片中所有元素的资源
        if (slideToDelete?.elements) {
          for (const element of slideToDelete.elements) {
            await handleResourceDelete(element);
          }
        }

        // 清理背景资源
        if (slideToDelete?.background?.type === 'image' && 
            slideToDelete.background.image?.startsWith('resource_')) {
          const rm = await getResourceManager();
          await rm.removeReference(slideToDelete.background.image, `slide_${index}_background`);
        }

        const newSlides = state.slides.filter((_, i) => i !== index);
        const newActiveIndex = index >= newSlides.length ? newSlides.length - 1 : index;

        set({
          slides: newSlides,
          activeSlideIndex: newActiveIndex,
        });

        get().createSnapshot('删除幻灯片');
      },

      duplicateSlide(index: number) {
        const state = get();
        const slideToClone = state.slides[index];
        if (!slideToClone) return;

        const newSlide: PPTSlide = {
          ...slideToClone,
          id: nanoid(),
          title: slideToClone.title + ' (副本)',
          elements: slideToClone.elements.map(element => ({
            ...element,
            id: nanoid(),
          })),
        };

        const newSlides = [...state.slides];
        newSlides.splice(index + 1, 0, newSlide);

        set({
          slides: newSlides,
          activeSlideIndex: index + 1,
        });

        get().createSnapshot('复制幻灯片');
      },

      moveSlide(fromIndex: number, toIndex: number) {
        const state = get();
        const newSlides = [...state.slides];
        const [movedSlide] = newSlides.splice(fromIndex, 1);
        newSlides.splice(toIndex, 0, movedSlide);

        set({
          slides: newSlides,
          activeSlideIndex: toIndex,
        });

        get().createSnapshot('移动幻灯片');
      },

      setActiveSlide(index: number) {
        set({
          activeSlideIndex: index,
          activeElementIds: [], // 切换幻灯片时清除选择
        });
      },

      updateSlideBackground(index: number, background: PPTSlide['background']) {
        const state = get();
        const newSlides = [...state.slides];
        if (newSlides[index]) {
          newSlides[index] = {
            ...newSlides[index],
            background,
          };
          set({ slides: newSlides });
          get().createSnapshot('修改背景');
        }
      },

      updateSlideTransition(index: number, transition: PPTSlide['transition']) {
        const state = get();
        const newSlides = [...state.slides];
        if (newSlides[index]) {
          newSlides[index] = {
            ...newSlides[index],
            transition,
          };
          set({ slides: newSlides });
          get().createSnapshot('修改切换效果');
        }
      },

      updateSlideNotes(index: number, notes: string) {
        const state = get();
        const newSlides = [...state.slides];
        if (newSlides[index]) {
          newSlides[index] = {
            ...newSlides[index],
            notes,
          };
          set({ slides: newSlides });
        }
      },

      updateSlideTitle(index: number, title: string) {
        const state = get();
        const newSlides = [...state.slides];
        if (newSlides[index]) {
          newSlides[index] = {
            ...newSlides[index],
            title,
          };
          set({ slides: newSlides });
          get().createSnapshot('修改幻灯片标题');
        }
      },

      // 元素操作
      async addElement(element: Omit<PPTElement, 'id'>) {
        const state = get();
        const currentSlide = state.slides[state.activeSlideIndex];
        
        // 计算新元素的zIndex：当前幻灯片中最大zIndex + 1
        const maxZIndex = currentSlide?.elements.length > 0 
          ? Math.max(...currentSlide.elements.map(el => el.zIndex))
          : 0;
        
        const newElement: PPTElement = {
          ...element,
          id: nanoid(),
          zIndex: Math.max(element.zIndex || 0, maxZIndex + 1), // 确保新元素在最上层
        };

        // 处理资源
        const processedElement = await processElementResourcesForAdd(newElement, state.activeSlideIndex);

        const newSlides = [...state.slides];
        const updatedSlide = newSlides[state.activeSlideIndex];
        if (updatedSlide) {
          updatedSlide.elements.push(processedElement);
          set({
            slides: newSlides,
            activeElementIds: [processedElement.id],
          });
          get().createSnapshot('添加元素');
        }
      },

      async updateElement(elementId: string, updates: Partial<PPTElement>, createSnapshot: boolean = true) {
        const state = get();
        const newSlides = [...state.slides];
        const currentSlide = newSlides[state.activeSlideIndex];

        if (currentSlide) {
          const elementIndex = currentSlide.elements.findIndex(el => el.id === elementId);
          if (elementIndex !== -1) {
            const oldElement = currentSlide.elements[elementIndex];
            const newElement = {
              ...oldElement,
              ...updates,
            };

            // 处理资源变化
            await handleResourceUpdate(elementId, oldElement, newElement, state.activeSlideIndex);

            currentSlide.elements[elementIndex] = newElement;
            set({ slides: newSlides });

            if (createSnapshot) {
              get().createSnapshot('修改元素');
            }
          }
        }
      },

      updateElementBatch(updates: Array<{ elementId: string; updates: Partial<PPTElement> }>, description: string = '批量修改元素') {
        const state = get();
        const newSlides = [...state.slides];
        const currentSlide = newSlides[state.activeSlideIndex];

        if (currentSlide) {
          updates.forEach(({ elementId, updates: elementUpdates }) => {
            const elementIndex = currentSlide.elements.findIndex(el => el.id === elementId);
            if (elementIndex !== -1) {
              currentSlide.elements[elementIndex] = {
                ...currentSlide.elements[elementIndex],
                ...elementUpdates,
              };
            }
          });

          set({ slides: newSlides });
          get().createSnapshot(description);
        }
      },

      async deleteElement(elementId: string) {
        const state = get();
        const newSlides = [...state.slides];
        const currentSlide = newSlides[state.activeSlideIndex];

        if (currentSlide) {
          const elementToDelete = currentSlide.elements.find(el => el.id === elementId);
          if (elementToDelete) {
            // 处理资源清理
            await handleResourceDelete(elementToDelete);
          }

          currentSlide.elements = currentSlide.elements.filter(el => el.id !== elementId);
          set({
            slides: newSlides,
            activeElementIds: state.activeElementIds.filter(id => id !== elementId),
          });
          get().createSnapshot('删除元素');
        }
      },

      async duplicateElement(elementId: string) {
        const state = get();
        const currentSlide = state.slides[state.activeSlideIndex];
        if (!currentSlide) return;

        const element = currentSlide.elements.find(el => el.id === elementId);
        if (!element) return;

        const newElement: PPTElement = {
          ...element,
          id: nanoid(),
          x: element.x + 20,
          y: element.y + 20,
        };

        await get().addElement(newElement);
      },

      selectElements(elementIds: string[]) {
        set({ activeElementIds: elementIds });
      },

      clearSelection() {
        set({ activeElementIds: [] });
      },

      groupElements(elementIds: string[]) {
        if (elementIds.length < 2) return;

        const state = get();
        const currentSlide = state.slides[state.activeSlideIndex];
        if (!currentSlide) return;

        const elementsToGroup = currentSlide.elements.filter(el => elementIds.includes(el.id));
        if (elementsToGroup.length < 2) return;

        // 计算组合边界
        const minX = Math.min(...elementsToGroup.map(el => el.x));
        const minY = Math.min(...elementsToGroup.map(el => el.y));
        const maxX = Math.max(...elementsToGroup.map(el => el.x + el.width));
        const maxY = Math.max(...elementsToGroup.map(el => el.y + el.height));

        // 创建组合元素
        const groupElement: PPTElement = {
          id: nanoid(),
          type: 'shape', // 使用shape作为组合容器
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
          rotation: 0,
          opacity: 1,
          locked: false,
          hidden: false,
          zIndex: Math.max(...elementsToGroup.map(el => el.zIndex)),
          name: `组合 (${elementsToGroup.length}个元素)`,
          isGroup: true,
          groupedElements: elementsToGroup.map(el => ({
            ...el,
            // 转换为相对坐标
            x: el.x - minX,
            y: el.y - minY,
          })),
          shape: {
            type: 'rectangle',
            fill: 'transparent',
            stroke: 'transparent',
            strokeWidth: 0,
          },
        };

        // 移除原始元素，添加组合元素
        const newSlides = [...state.slides];
        const newSlide = { ...newSlides[state.activeSlideIndex] };
        newSlide.elements = [
          ...newSlide.elements.filter(el => !elementIds.includes(el.id)),
          groupElement,
        ];
        newSlides[state.activeSlideIndex] = newSlide;

        set({
          slides: newSlides,
          activeElementIds: [groupElement.id],
        });

        get().createSnapshot('组合元素');
      },

      ungroupElements(groupId: string) {
        const state = get();
        const currentSlide = state.slides[state.activeSlideIndex];
        if (!currentSlide) return;

        const groupElement = currentSlide.elements.find(el => el.id === groupId);
        if (!groupElement || !groupElement.isGroup || !groupElement.groupedElements) return;

        // 恢复组合前的元素
        const restoredElements = groupElement.groupedElements.map(el => ({
          ...el,
          id: nanoid(), // 重新生成ID
          // 转换回绝对坐标
          x: el.x + groupElement.x,
          y: el.y + groupElement.y,
        }));

        // 移除组合元素，添加恢复的元素
        const newSlides = [...state.slides];
        const newSlide = { ...newSlides[state.activeSlideIndex] };
        newSlide.elements = [
          ...newSlide.elements.filter(el => el.id !== groupId),
          ...restoredElements,
        ];
        newSlides[state.activeSlideIndex] = newSlide;

        set({
          slides: newSlides,
          activeElementIds: restoredElements.map(el => el.id),
        });

        get().createSnapshot('取消组合');
      },

      lockElement(elementId: string) {
        get().updateElement(elementId, { locked: true });
      },

      unlockElement(elementId: string) {
        get().updateElement(elementId, { locked: false });
      },

      hideElement(elementId: string) {
        get().updateElement(elementId, { hidden: true });
        const state = get();
        set({
          hiddenElementIds: [...state.hiddenElementIds, elementId],
          activeElementIds: state.activeElementIds.filter(id => id !== elementId),
        });
      },

      showElement(elementId: string) {
        get().updateElement(elementId, { hidden: false });
        const state = get();
        set({
          hiddenElementIds: state.hiddenElementIds.filter(id => id !== elementId),
        });
      },

      bringToFront(elementId: string) {
        const state = get();
        const currentSlide = state.slides[state.activeSlideIndex];
        if (!currentSlide) return;

        const maxZIndex = Math.max(...currentSlide.elements.map(el => el.zIndex));
        get().updateElement(elementId, { zIndex: maxZIndex + 1 });
        get().createSnapshot('置于顶层');
      },

      sendToBack(elementId: string) {
        const state = get();
        const currentSlide = state.slides[state.activeSlideIndex];
        if (!currentSlide) return;

        const minZIndex = Math.min(...currentSlide.elements.map(el => el.zIndex));
        get().updateElement(elementId, { zIndex: minZIndex - 1 });
        get().createSnapshot('置于底层');
      },

      bringForward(elementId: string) {
        const state = get();
        const currentSlide = state.slides[state.activeSlideIndex];
        if (!currentSlide) return;

        const element = currentSlide.elements.find(el => el.id === elementId);
        if (!element) return;

        // 找到当前元素上方的元素
        const elementsAbove = currentSlide.elements.filter(el => el.zIndex > element.zIndex);
        if (elementsAbove.length > 0) {
          const nextZIndex = Math.min(...elementsAbove.map(el => el.zIndex));
          get().updateElement(elementId, { zIndex: nextZIndex + 1 });
        } else {
          // 如果没有上方元素，则移到最顶层
          const maxZIndex = Math.max(...currentSlide.elements.map(el => el.zIndex));
          get().updateElement(elementId, { zIndex: maxZIndex + 1 });
        }
        get().createSnapshot('上移一层');
      },

      sendBackward(elementId: string) {
        const state = get();
        const currentSlide = state.slides[state.activeSlideIndex];
        if (!currentSlide) return;

        const element = currentSlide.elements.find(el => el.id === elementId);
        if (!element) return;

        // 找到当前元素下方的元素
        const elementsBelow = currentSlide.elements.filter(el => el.zIndex < element.zIndex);
        if (elementsBelow.length > 0) {
          const prevZIndex = Math.max(...elementsBelow.map(el => el.zIndex));
          get().updateElement(elementId, { zIndex: prevZIndex - 1 });
        } else {
          // 如果没有下方元素，则移到最底层
          const minZIndex = Math.min(...currentSlide.elements.map(el => el.zIndex));
          get().updateElement(elementId, { zIndex: minZIndex - 1 });
        }
        get().createSnapshot('下移一层');
      },

      // 对齐操作
      alignElements(alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom', elementIds: string[]) {
        if (elementIds.length < 2) return;

        const state = get();
        const currentSlide = state.slides[state.activeSlideIndex];
        if (!currentSlide) return;

        const elements = currentSlide.elements.filter(el => elementIds.includes(el.id));
        if (elements.length < 2) return;

        let alignValue: number;
        const updates: Array<{ elementId: string; updates: Partial<PPTElement> }> = [];

        switch (alignment) {
          case 'left':
            alignValue = Math.min(...elements.map(el => el.x));
            elements.forEach(el => {
              updates.push({ elementId: el.id, updates: { x: alignValue } });
            });
            break;

          case 'center':
            alignValue = (Math.min(...elements.map(el => el.x)) + Math.max(...elements.map(el => el.x + el.width))) / 2;
            elements.forEach(el => {
              updates.push({ elementId: el.id, updates: { x: alignValue - el.width / 2 } });
            });
            break;

          case 'right':
            alignValue = Math.max(...elements.map(el => el.x + el.width));
            elements.forEach(el => {
              updates.push({ elementId: el.id, updates: { x: alignValue - el.width } });
            });
            break;

          case 'top':
            alignValue = Math.min(...elements.map(el => el.y));
            elements.forEach(el => {
              updates.push({ elementId: el.id, updates: { y: alignValue } });
            });
            break;

          case 'middle':
            alignValue = (Math.min(...elements.map(el => el.y)) + Math.max(...elements.map(el => el.y + el.height))) / 2;
            elements.forEach(el => {
              updates.push({ elementId: el.id, updates: { y: alignValue - el.height / 2 } });
            });
            break;

          case 'bottom':
            alignValue = Math.max(...elements.map(el => el.y + el.height));
            elements.forEach(el => {
              updates.push({ elementId: el.id, updates: { y: alignValue - el.height } });
            });
            break;
        }

        if (updates.length > 0) {
          get().updateElementBatch(updates, `对齐元素-${alignment}`);
        }
      },

      distributeElements(direction: 'horizontal' | 'vertical', elementIds: string[]) {
        if (elementIds.length < 3) return;

        const state = get();
        const currentSlide = state.slides[state.activeSlideIndex];
        if (!currentSlide) return;

        const elements = currentSlide.elements
          .filter(el => elementIds.includes(el.id))
          .sort((a, b) => direction === 'horizontal' ? a.x - b.x : a.y - b.y);

        if (elements.length < 3) return;

        const updates: Array<{ elementId: string; updates: Partial<PPTElement> }> = [];

        if (direction === 'horizontal') {
          const totalWidth = elements[elements.length - 1].x + elements[elements.length - 1].width - elements[0].x;
          const totalElementWidth = elements.reduce((sum, el) => sum + el.width, 0);
          const totalGap = totalWidth - totalElementWidth;
          const gapBetween = totalGap / (elements.length - 1);

          let currentX = elements[0].x;
          elements.forEach((el, index) => {
            if (index > 0 && index < elements.length - 1) {
              currentX += elements[index - 1].width + gapBetween;
              updates.push({ elementId: el.id, updates: { x: currentX } });
            }
          });
        } else {
          const totalHeight = elements[elements.length - 1].y + elements[elements.length - 1].height - elements[0].y;
          const totalElementHeight = elements.reduce((sum, el) => sum + el.height, 0);
          const totalGap = totalHeight - totalElementHeight;
          const gapBetween = totalGap / (elements.length - 1);

          let currentY = elements[0].y;
          elements.forEach((el, index) => {
            if (index > 0 && index < elements.length - 1) {
              currentY += elements[index - 1].height + gapBetween;
              updates.push({ elementId: el.id, updates: { y: currentY } });
            }
          });
        }

        if (updates.length > 0) {
          get().updateElementBatch(updates, `分布元素-${direction === 'horizontal' ? '水平' : '垂直'}`);
        }
      },

      // 画布操作
      setCanvasScale(scale: number) {
        set({ canvasScale: Math.max(0.25, Math.min(4, scale)) });
      },

      setCanvasOffset(x: number, y: number) {
        set({ canvasOffsetX: x, canvasOffsetY: y });
      },

      toggleGrid() {
        set({ showGrid: !get().showGrid });
      },

      toggleRuler() {
        set({ showRuler: !get().showRuler });
      },

      setGridSize(size: number) {
        set({ gridSize: Math.max(10, Math.min(100, size)) });
      },

      resetCanvas() {
        // 触发画布居中事件，让Canvas组件重新计算居中位置
        window.dispatchEvent(new CustomEvent('resetCanvasView'));
      },

      setCanvasSize(size: PPTSize) {
        set({ canvasSize: size });
        get().createSnapshot(`更改画布尺寸为 ${size.name}`);
      },

      // 界面操作
      toggleThumbnails() {
        set({ showThumbnails: !get().showThumbnails });
      },

      toggleToolbar() {
        set({ showToolbar: !get().showToolbar });
      },

      toggleRemark() {
        set({ showRemark: !get().showRemark });
      },

      setThumbnailsWidth(width: number) {
        set({ thumbnailsWidth: Math.max(200, Math.min(400, width)) });
      },

      setToolbarWidth(width: number) {
        set({ toolbarWidth: Math.max(280, Math.min(500, width)) });
      },

      setRemarkHeight(height: number) {
        set({ remarkHeight: Math.max(80, Math.min(300, height)) });
      },

      toggleFullscreen() {
        const state = get();
        const newFullscreenState = !state.isFullscreen;

        set({ isFullscreen: newFullscreenState });

        // 触发浏览器全屏切换
        if (newFullscreenState) {
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {
              console.warn('无法进入全屏模式');
              set({ isFullscreen: false });
            });
          }
        } else {
          if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => {
              console.warn('无法退出全屏模式');
            });
          }
        }

        // 分发自定义事件通知其他组件
        window.dispatchEvent(new CustomEvent('fullscreenChange', {
          detail: { isFullscreen: newFullscreenState }
        }));
      },

      // 工具操作
      setSelectedTool(tool: PPTState['selectedTool']) {
        set({ selectedTool: tool });
      },

      setToolbarActivePanel(panel: PPTState['toolbarActivePanel']) {
        set({ toolbarActivePanel: panel });
      },

      setCreatingElement(type: PPTElement['type'] | null) {
        set({
          creatingElement: {
            type,
            isCreating: type !== null,
          },
        });
      },

      // 编辑操作
      startEditing(elementId: string) {
        set({
          isEditing: true,
          editingElementId: elementId,
        });
      },

      stopEditing() {
        set({
          isEditing: false,
          editingElementId: null,
        });
      },

      // 主题和模板
      applyTheme(theme: PPTTheme) {
        set({ currentTheme: theme });
        get().createSnapshot('应用主题');
      },

      applyTemplate(template: PPTTemplate) {
        const state = get();
        const newSlides = template.slides.map(slide => ({
          ...createEmptySlide(),
          ...slide,
          id: nanoid(),
          elements: slide.elements?.map(element => ({
            ...element,
            id: nanoid(),
          })) || [],
        }));

        set({
          slides: newSlides,
          activeSlideIndex: 0,
          currentTheme: template.theme,
        });

        get().createSnapshot('应用模板');
      },

      // 历史记录
      createSnapshot(description: string) {
        const state = get();

        // 检查是否应该跳过快照创建（避免频繁创建导致存储问题）
        const now = Date.now();
        const lastSnapshot = state.historySnapshots[state.historySnapshots.length - 1];
        if (lastSnapshot && (now - lastSnapshot.timestamp) < 1000) {
          // 如果距离上次快照创建不到1秒，跳过
          return;
        }

        const snapshot: HistorySnapshot = {
          id: nanoid(),
          timestamp: now,
          slides: JSON.parse(JSON.stringify(state.slides)), // 深拷贝
          activeSlideIndex: state.activeSlideIndex,
          description,
        };

        const newSnapshots = state.historySnapshots.slice(0, state.currentSnapshotIndex + 1);
        newSnapshots.push(snapshot);

        // 动态限制历史记录数量，根据数据大小调整
        const maxSnapshots = get().getMaxSnapshots();
        if (newSnapshots.length > maxSnapshots) {
          newSnapshots.shift();
        }

        try {
          set({
            historySnapshots: newSnapshots,
            currentSnapshotIndex: newSnapshots.length - 1,
          });
        } catch (error) {
          console.warn('快照创建失败，可能是存储空间不足:', error);
          // 如果存储失败，尝试清理更多历史记录
          if (newSnapshots.length > 1) {
            // 只保留最近的5个快照
            const limitedSnapshots = newSnapshots.slice(-5);
            try {
              set({
                historySnapshots: limitedSnapshots,
                currentSnapshotIndex: limitedSnapshots.length - 1,
              });
            } catch (retryError) {
              console.warn('清理后重试也失败，跳过快照创建');
            }
          }
        }
      },

      // 根据数据大小动态计算最大快照数量
      getMaxSnapshots() {
        const state = get();
        const dataSize = JSON.stringify(state.slides).length;

        // 根据数据大小动态调整快照数量
        if (dataSize > 1000000) { // 1MB
          return 5;
        } else if (dataSize > 500000) { // 500KB
          return 10;
        } else if (dataSize > 100000) { // 100KB
          return 15;
        } else {
          return 20;
        }
      },

      undo() {
        const state = get();
        if (state.currentSnapshotIndex > 0) {
          const prevSnapshot = state.historySnapshots[state.currentSnapshotIndex - 1];
          set({
            slides: JSON.parse(JSON.stringify(prevSnapshot.slides)),
            activeSlideIndex: prevSnapshot.activeSlideIndex,
            currentSnapshotIndex: state.currentSnapshotIndex - 1,
            activeElementIds: [], // 清除选择
          });
        }
      },

      redo() {
        const state = get();
        if (state.currentSnapshotIndex < state.historySnapshots.length - 1) {
          const nextSnapshot = state.historySnapshots[state.currentSnapshotIndex + 1];
          set({
            slides: JSON.parse(JSON.stringify(nextSnapshot.slides)),
            activeSlideIndex: nextSnapshot.activeSlideIndex,
            currentSnapshotIndex: state.currentSnapshotIndex + 1,
            activeElementIds: [], // 清除选择
          });
        }
      },

      canUndo() {
        return get().currentSnapshotIndex > 0;
      },

      canRedo() {
        const state = get();
        return state.currentSnapshotIndex < state.historySnapshots.length - 1;
      },

      // 格式刷
      startFormatPainter(elementId: string, type: 'text' | 'shape') {
        set({
          formatPainter: {
            isActive: true,
            sourceElementId: elementId,
            type,
          },
        });
      },

      applyFormatPainter(targetElementId: string) {
        const state = get();
        const { formatPainter } = state;

        if (!formatPainter.isActive || !formatPainter.sourceElementId) return;

        const currentSlide = state.slides[state.activeSlideIndex];
        if (!currentSlide) return;

        const sourceElement = currentSlide.elements.find(el => el.id === formatPainter.sourceElementId);
        const targetElement = currentSlide.elements.find(el => el.id === targetElementId);

        if (sourceElement && targetElement && sourceElement.type === targetElement.type) {
          // 复制样式属性
          const styleUpdates: Partial<PPTElement> = {};

          if (formatPainter.type === 'text' && sourceElement.text && targetElement.text) {
            styleUpdates.text = {
              ...targetElement.text,
              fontSize: sourceElement.text.fontSize,
              fontFamily: sourceElement.text.fontFamily,
              color: sourceElement.text.color,
              bold: sourceElement.text.bold,
              italic: sourceElement.text.italic,
              underline: sourceElement.text.underline,
              strikethrough: sourceElement.text.strikethrough,
              align: sourceElement.text.align,
              lineHeight: sourceElement.text.lineHeight,
              letterSpacing: sourceElement.text.letterSpacing,
            };
          }

          if (formatPainter.type === 'shape' && sourceElement.shape && targetElement.shape) {
            styleUpdates.shape = {
              ...targetElement.shape,
              fill: sourceElement.shape.fill,
              stroke: sourceElement.shape.stroke,
              strokeWidth: sourceElement.shape.strokeWidth,
              gradient: sourceElement.shape.gradient,
            };
          }

          get().updateElement(targetElementId, styleUpdates);
          get().createSnapshot('应用格式刷');
        }
      },

      stopFormatPainter() {
        set({
          formatPainter: {
            isActive: false,
            sourceElementId: null,
            type: null,
          },
        });
      },

      // 剪贴板操作
      copyElements(elementIds: string[]) {
        const state = get();
        const currentSlide = state.slides[state.activeSlideIndex];
        if (!currentSlide) return;

        const elementsToCopy = currentSlide.elements.filter(el => elementIds.includes(el.id));
        set({
          clipboard: {
            ...state.clipboard,
            elements: JSON.parse(JSON.stringify(elementsToCopy)), // 深拷贝
          },
        });
      },

      async cutElements(elementIds: string[]) {
        get().copyElements(elementIds);
        for (const id of elementIds) {
          await get().deleteElement(id);
        }
      },

      pasteElements() {
        const state = get();
        if (state.clipboard.elements.length === 0) return;

        const pastedElements = state.clipboard.elements.map(element => ({
          ...element,
          id: nanoid(),
          x: element.x + 20, // 偏移粘贴
          y: element.y + 20,
        }));

        const newSlides = [...state.slides];
        const currentSlide = newSlides[state.activeSlideIndex];
        if (currentSlide) {
          currentSlide.elements.push(...pastedElements);
          set({
            slides: newSlides,
            activeElementIds: pastedElements.map(el => el.id),
          });
          get().createSnapshot('粘贴元素');
        }
      },

      copySlides(slideIndices: number[]) {
        const state = get();
        const slidesToCopy = slideIndices.map(index => state.slides[index]).filter(Boolean);
        set({
          clipboard: {
            ...state.clipboard,
            slides: JSON.parse(JSON.stringify(slidesToCopy)), // 深拷贝
          },
        });
      },

      pasteSlides() {
        const state = get();
        if (state.clipboard.slides.length === 0) return;

        const pastedSlides = state.clipboard.slides.map(slide => ({
          ...slide,
          id: nanoid(),
          title: slide.title + ' (副本)',
          elements: slide.elements.map(element => ({
            ...element,
            id: nanoid(),
          })),
        }));

        const newSlides = [...state.slides];
        // 在当前幻灯片后插入
        newSlides.splice(state.activeSlideIndex + 1, 0, ...pastedSlides);

        set({
          slides: newSlides,
          activeSlideIndex: state.activeSlideIndex + pastedSlides.length,
        });

        get().createSnapshot('粘贴幻灯片');
      },

      // 导出功能
      async exportToPPTX() {
        const state = get();
        set({ exportProgress: { isExporting: true, progress: 0, type: 'pptx' } });

        try {
          await exportService.exportToPPTX(state.slides, state.title);
          set({ exportProgress: { isExporting: false, progress: 100, type: null } });
        } catch (error) {
          console.error('PPTX export failed:', error);
          set({ exportProgress: { isExporting: false, progress: 0, type: null } });
          throw error;
        }
      },

      async exportToPDF() {
        const state = get();
        set({ exportProgress: { isExporting: true, progress: 0, type: 'pdf' } });

        try {
          await exportService.exportToPDF(state.slides, state.title);
          set({ exportProgress: { isExporting: false, progress: 100, type: null } });
        } catch (error) {
          console.error('PDF export failed:', error);
          set({ exportProgress: { isExporting: false, progress: 0, type: null } });
          throw error;
        }
      },

      async exportToImages() {
        const state = get();
        set({ exportProgress: { isExporting: true, progress: 0, type: 'image' } });

        try {
          await exportService.exportToImages(state.slides, state.title);
          set({ exportProgress: { isExporting: false, progress: 100, type: null } });
        } catch (error) {
          console.error('Image export failed:', error);
          set({ exportProgress: { isExporting: false, progress: 0, type: null } });
          throw error;
        }
      },

      async exportToJSON() {
        const state = get();
        await exportService.exportToJSON(state.slides, state.title);
      },

      // 调试功能
      debugState() {
        const state = get();
        console.log('=== 当前Store状态调试 ===');
        console.log('标题:', state.title);
        console.log('幻灯片数量:', state.slides.length);
        console.log('当前幻灯片索引:', state.activeSlideIndex);
        console.log('当前幻灯片:', state.slides[state.activeSlideIndex] ? {
          id: state.slides[state.activeSlideIndex].id,
          title: state.slides[state.activeSlideIndex].title,
          elementsCount: state.slides[state.activeSlideIndex].elements.length,
          elements: state.slides[state.activeSlideIndex].elements.map(el => ({
            id: el.id,
            type: el.type,
            name: el.name,
            x: el.x,
            y: el.y,
            width: el.width,
            height: el.height
          }))
        } : null);
        console.log('所有幻灯片:', state.slides.map((slide, index) => ({
          index,
          id: slide.id,
          title: slide.title,
          elementsCount: slide.elements.length
        })));
        console.log('=== 调试结束 ===');
      },

      // 手动从IndexedDB恢复数据
      async manualRestoreFromIndexedDB() {
        try {
          console.log('=== 手动恢复IndexedDB数据 ===');

          // 检查是否在浏览器环境
          if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
            console.warn('服务端渲染环境或不支持IndexedDB，无法手动恢复');
            return;
          }

          // 直接从IndexedDB读取数据
          const { openDB } = await import('idb');
          const db = await openDB('ppt-editor-db', 1, {
            upgrade(db) {
              if (!db.objectStoreNames.contains('store')) {
                db.createObjectStore('store');
              }
            },
          });

          const rawData = await db.get('store', 'ppt-editor-store');
          console.log('从IndexedDB读取的原始数据:', rawData);

          if (rawData && rawData.state) {
            const state = rawData.state;
            console.log('提取的状态数据:', state);

            // 手动更新状态
            set({
              title: state.title || '未命名演示文稿',
              slides: state.slides || [{
                id: nanoid(),
                title: '幻灯片 1',
                elements: [],
                background: { type: 'color', value: '#FFFFFF' },
                transition: { type: 'none', duration: 500 },
                notes: '',
                tags: [],
              }],
              activeSlideIndex: state.activeSlideIndex || 0,
              currentTheme: state.currentTheme || DEFAULT_THEME,
              showGrid: state.showGrid !== undefined ? state.showGrid : false,
              showRuler: state.showRuler !== undefined ? state.showRuler : true,
              gridSize: state.gridSize || 20,
              thumbnailsWidth: state.thumbnailsWidth || 240,
              toolbarWidth: state.toolbarWidth || 320,
              remarkHeight: state.remarkHeight || 120,
              showThumbnails: state.showThumbnails !== undefined ? state.showThumbnails : true,
              showToolbar: state.showToolbar !== undefined ? state.showToolbar : true,
              showRemark: state.showRemark !== undefined ? state.showRemark : false,
            });

            console.log('✅ 手动恢复完成');
            console.log('恢复后的状态:', {
              title: get().title,
              slidesCount: get().slides.length,
              activeSlideIndex: get().activeSlideIndex
            });
          } else {
            console.warn('IndexedDB中没有找到有效的状态数据');
          }
        } catch (error) {
          console.error('手动恢复失败:', error);
        }
        console.log('=== 手动恢复结束 ===');
      },

      // 调试元素层级
      debugElementZIndex() {
        const state = get();
        const currentSlide = state.slides[state.activeSlideIndex];

        console.log('=== 元素层级调试 ===');
        console.log('当前幻灯片:', currentSlide?.title);
        console.log('元素总数:', currentSlide?.elements.length || 0);

        if (currentSlide && currentSlide.elements.length > 0) {
          // 按zIndex排序显示
          const sortedElements = [...currentSlide.elements].sort((a, b) => a.zIndex - b.zIndex);

          console.log('元素层级排序（从底层到顶层）:');
          sortedElements.forEach((element, index) => {
            console.log(`${index + 1}. ${element.name} (${element.type}) - zIndex: ${element.zIndex}`);
          });

          // 检查是否有层级问题
          const imageElements = sortedElements.filter(el => el.type === 'image');
          const textElements = sortedElements.filter(el => el.type === 'text');

          if (imageElements.length > 0 && textElements.length > 0) {
            const maxImageZIndex = Math.max(...imageElements.map(el => el.zIndex));
            const minTextZIndex = Math.min(...textElements.map(el => el.zIndex));

            if (maxImageZIndex >= minTextZIndex) {
              console.warn('⚠️ 发现层级问题：图片zIndex大于或等于文字zIndex');
              console.warn(`最高图片zIndex: ${maxImageZIndex}, 最低文字zIndex: ${minTextZIndex}`);
            } else {
              console.log('✅ 层级正常：图片在文字下方');
            }
          }
        } else {
          console.log('当前幻灯片没有元素');
        }
        console.log('=== 层级调试结束 ===');
      },

        // HTML内容解析函数
        parseHTMLContent: (htmlContent: string) => {
          if (!htmlContent) return { content: '', fontSize: 16, fontFamily: 'Arial', color: '#374151', bold: false, italic: false, align: 'left' as const, lineCount: 1 };

          // 创建临时DOM元素来解析HTML
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = htmlContent;

          // 递归处理DOM节点，正确解析段落和列表结构
          const processNode = (node: Node): string => {
            let result = '';

            if (node.nodeType === Node.TEXT_NODE) {
              const text = node.textContent?.trim() || '';
              return text;
            }

            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              const tagName = element.tagName.toLowerCase();

              // 处理段落标签
              if (tagName === 'p') {
                const pText = Array.from(element.childNodes).map(processNode).join('').trim();
                if (pText) {
                  result += pText + '\n';
                }
              }
              // 处理无序列表
              else if (tagName === 'ul') {
                const listItems = element.querySelectorAll('li');
                listItems.forEach(li => {
                  const liText = Array.from(li.childNodes).map(processNode).join('').trim();
                  if (liText) {
                    result += '· ' + liText + '\n';
                  }
                });
              }
              // 处理有序列表
              else if (tagName === 'ol') {
                const listItems = element.querySelectorAll('li');
                listItems.forEach((li, index) => {
                  const liText = Array.from(li.childNodes).map(processNode).join('').trim();
                  if (liText) {
                    result += `${index + 1}. ` + liText + '\n';
                  }
                });
              }
              // 处理列表项（防止重复处理）
              else if (tagName === 'li') {
                // 列表项已在ul/ol中处理，这里直接返回文本内容
                return Array.from(element.childNodes).map(processNode).join('').trim();
              }
              // 处理其他标签，递归处理子节点
              else {
                result += Array.from(element.childNodes).map(processNode).join('');
              }
            }

            return result;
          };

          // 处理根节点的所有子节点
          let content = '';
          const rootChildren = Array.from(tempDiv.childNodes);

          rootChildren.forEach(child => {
            const processed = processNode(child);
            if (processed.trim()) {
              content += processed;
            }
          });

          // 清理多余的换行符，但保留段落和列表的结构
          content = content
            .replace(/\n{3,}/g, '\n\n') // 最多保留两个连续换行符
            .replace(/^\n+/, '') // 去除开头的换行符
            .replace(/\n+$/, ''); // 去除结尾的换行符

          // 如果没有解析到内容，回退到简单的文本提取
          if (!content.trim()) {
            content = tempDiv.textContent || tempDiv.innerText || '';
          }

          // 计算行数
          const lines = content.split('\n').filter(line => line.trim().length > 0);
          const lineCount = Math.max(1, lines.length);

          // 提取样式信息
          const pElement = tempDiv.querySelector('p');
          const spanElement = tempDiv.querySelector('span');
          const element = pElement || spanElement || tempDiv;

          // 解析字体大小
          let fontSize = 16;
          const fontSizeMatch = htmlContent.match(/font-size:\s*(\d+(?:\.\d+)?)pt/);
          if (fontSizeMatch) {
            fontSize = parseFloat(fontSizeMatch[1]); // 保持pt，后续在导入映射时统一转换
          }

          // 解析字体族
          const fontFamilyMatch = htmlContent.match(/font-family:\s*([^;]+)/);
          const fontFamily = fontFamilyMatch ? fontFamilyMatch[1].replace(/['"]/g, '') : 'Arial';

          // 解析颜色
          const colorMatch = htmlContent.match(/color:\s*([^;]+)/);
          const color = colorMatch ? colorMatch[1].trim() : '#374151';

          // 解析粗体和斜体
          const bold = htmlContent.includes('font-weight: bold') || htmlContent.includes('font-weight:bold');
          const italic = htmlContent.includes('font-style: italic') || htmlContent.includes('font-style:italic');

          // 解析对齐方式
          const alignMatch = htmlContent.match(/text-align:\s*([^;]+)/);
          const align = alignMatch ? alignMatch[1].trim() as 'left' | 'center' | 'right' | 'justify' : 'left';

          return {
            content,
            fontSize,
            fontFamily,
            color,
            bold,
            italic,
            align,
            lineCount
          };
        },

        // 导入功能辅助方法
        mapElementType: (type: string): PPTElement['type'] => {
          const typeMap: Record<string, PPTElement['type']> = {
            'text': 'text',
            'textbox': 'text',
            'paragraph': 'text',
            'shape': 'shape',
            'rectangle': 'shape',
            'circle': 'shape',
            'triangle': 'shape',
            'image': 'image',
            'picture': 'image',
            'table': 'table',
            'chart': 'chart',
            'line': 'line',
            'straight': 'line', // 直线
            'curve': 'line', // 曲线
            'connector': 'line', // 连接线
            'arrow': 'line',
            'group': 'group',
            'groupshape': 'group',
            'grouped': 'group',
          };
          return typeMap[type?.toLowerCase()] || 'text';
        },

        mapShapeType: (type: string): 'rectangle' | 'circle' | 'triangle' | 'diamond' | 'star' | 'custom' => {
          return mapPPTXShapeType(type);
        },

        convertCoordinate: (value: any): number => {
          if (typeof value === 'number') return value * 1.33; // pt to px conversion (1pt = 1.33px)
          if (typeof value === 'string') {
            const parsed = parseFloat(value);
            return isNaN(parsed) ? 100 : parsed * 1.33;
          }
          return 100;
        },

        convertSize: (value: any): number => {
          if (typeof value === 'number') return Math.max(value * 1.33, 10); // pt to px conversion
          if (typeof value === 'string') {
            const parsed = parseFloat(value);
            return isNaN(parsed) ? 200 : Math.max(parsed * 1.33, 10);
          }
          return 200;
        },

        convertFontSize: (value: any): number => {
          if (typeof value === 'number') return Math.max(value * 1.33, 8); // pt to px conversion
          if (typeof value === 'string') {
            const parsed = parseFloat(value);
            return isNaN(parsed) ? 16 : Math.max(parsed * 1.33, 8);
          }
          return 16;
        },

        convertColor: (value: any): string => {
          if (typeof value === 'string') {
            // 如果是有效的颜色值，直接返回
            if (value.match(/^#[0-9A-Fa-f]{6}$/) || value.match(/^#[0-9A-Fa-f]{3}$/)) {
              return value;
            }
            // 如果是RGB格式，转换为十六进制
            if (value.startsWith('rgb')) {
              return get().rgbToHex(value);
            }
            // 如果是颜色名称，返回默认颜色
            return '#374151';
          }
          return '#374151';
        },

        rgbToHex: (rgb: string): string => {
          const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
          if (match) {
            const r = parseInt(match[1]);
            const g = parseInt(match[2]);
            const b = parseInt(match[3]);
            return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
          }
          return '#374151';
        },

        convertAlign: (value: any): 'left' | 'center' | 'right' | 'justify' => {
          const alignMap: Record<string, 'left' | 'center' | 'right' | 'justify'> = {
            'left': 'left',
            'center': 'center',
            'middle': 'center',
            'right': 'right',
            'justify': 'justify',
          };
          return alignMap[value?.toLowerCase()] || 'left';
        },

        extractColorFromFill: (fill: any): string => {
          if (!fill) return 'transparent';

          if (fill.type === 'color') {
            return fill.value || 'transparent';
          } else if (fill.type === 'image') {
            // 对于图片填充，返回base64数据或图片URL
            if (fill.value?.picBase64) {
              return fill.value.picBase64;
            } else if (fill.value?.src) {
              return fill.value.src;
            } else if (fill.value && typeof fill.value === 'string') {
              return fill.value;
            }
            return 'transparent';
          } else if (fill.type === 'gradient') {
            return fill.value?.colors?.[0]?.color || 'transparent';
          }

          return 'transparent';
        },

        mapChartType: (chartType: string): 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'radar' => {
          const chartMap: Record<string, 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'radar'> = {
            'bar': 'bar',
            'column': 'bar',
            'line': 'line',
            'pie': 'pie',
            'area': 'area',
            'scatter': 'scatter',
            'radar': 'radar',
          };
          return chartMap[chartType?.toLowerCase()] || 'bar';
        },

        calculateElementZIndex: (elementType: string, index: number): number => {
          // 基础层级乘数，确保不同类型的元素有明确的层级分离
          const baseZIndex = {
            'image': 100,   // 图片（背景）在最底层
            'shape': 200,   // 形状在中低层
            'line': 300,    // 线条在中层
            'chart': 400,   // 图表在中高层
            'table': 500,   // 表格在高层
            'text': 600,    // 文字在最高层
          };

          const base = baseZIndex[elementType as keyof typeof baseZIndex] || 300;

          // 在同类型元素中，根据索引确定具体层级
          // 索引越大，层级越高（后添加的元素在上层）
          return base + index;
        },

  async importFromPPTX(file: File) {
    try {
      console.log('Importing PPTX:', file.name);

      // 使用Promise包装FileReader操作，确保异步完成
      return new Promise<void>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
          try {
            // const arrayBuffer = e.target?.result as ArrayBuffer;
            // if (!arrayBuffer) {
            //   throw new Error('文件读取失败');
            // }

            // 使用pptxtojson库解析PPTX文件
            try {
              const result = await parse(e.target?.result as ArrayBuffer);
              console.log('PPTX解析结果:', result);

              // 检查解析结果是否有效
              console.log('PPTX解析结果结构:', {
                hasSlides: !!(result && result.slides),
                slidesCount: result?.slides?.length || 0,
                resultKeys: result ? Object.keys(result) : [],
                firstSlide: result?.slides?.[0] ? Object.keys(result.slides[0]) : [],
                themeColors: result?.themeColors,
                size: result?.size
              });
              // 计算导入单位缩放，将 pt 映射到编辑器基准坐标
              const canvasDimensions = getCanvasDimensions();
              const slidePtWidth = (result && result.size && result.size.width) ? result.size.width : canvasDimensions.width;
              const slidePtHeight = (result && result.size && result.size.height) ? result.size.height : canvasDimensions.height;
              const { scaleX, scaleY } = calculateScaleFactors(slidePtWidth, slidePtHeight);


              if (result && result.slides && Array.isArray(result.slides)) {
                console.log('开始转换幻灯片，总数:', result.slides.length);
                
                // 检查原始解析数据大小
                const originalDataSize = JSON.stringify(result.slides).length;
                console.log(`📊 原始解析数据大小: ${(originalDataSize / 1024).toFixed(2)}KB`);
                
                const convertedSlides: PPTSlide[] = result.slides.map((slide: any, index: number) => {
                  console.log(`处理幻灯片 ${index + 1}:`, {
                    slideKeys: Object.keys(slide),
                    elementsCount: slide.elements?.length || 0,
                    layoutElementsCount: slide.layoutElements?.length || 0,
                    fill: slide.fill,
                    note: slide.note,
                    slide
                  });

                  // 合并elements和layoutElements，并按类型排序确保正确的层级
                  const allElements = [
                    ...(slide.layoutElements.map(item => {
                      item.isLayoutElement = true;
                      return item;
                    }) || []),
                    ...(slide.elements || [])
                  ];

                  // 按元素类型重新排序，确保背景元素在底层，文字在顶层
                  allElements.sort((a, b) => {
                    const getElementPriority = (element: any) => {
                      // 优先级越低，层级越低（越在底层）
                      switch (element.type) {
                        case 'image': return 1; // 图片作为背景，最低层级
                        case 'shape': return 2; // 形状在中层
                        case 'line': return 3;  // 线条在上层
                        case 'chart': return 4; // 图表在上层
                        case 'table': return 5; // 表格在上层
                        case 'group': return 5; // 组合元素在上层
                        case 'text': return 6;  // 文字在最上层
                        default: return 3;      // 默认中等层级
                      }
                    };
                    return getElementPriority(a) - getElementPriority(b);
                  });

                  return {
                    id: nanoid(),
                    title: `幻灯片 ${index + 1}`,
                    elements: allElements.map((element: any, elemIndex: number) => {

                      const toNumber = (v: any, fallback: number = 0) => {
                        if (typeof v === 'number') return v;
                        const n = parseFloat(v);
                        return isNaN(n) ? fallback : n;
                      };

                      // 解析透明度
                      const opacity = element.opacity !== undefined ? toNumber(element.opacity, 1) :
                                     element.alpha !== undefined ? toNumber(element.alpha, 1) : 1;

                      const                       convertedElement: PPTElement = {
                        id: nanoid(),
                        type: get().mapElementType(element.type),
                        x: toNumber(element.left) * scaleX,
                        y: toNumber(element.top) * scaleY,
                        width: Math.max(10, toNumber(element.width, 100) * scaleX),
                        height: Math.max(10, toNumber(element.height, 50) * scaleY),
                        rotation: toNumber(element.rotate || element.rotation),
                        opacity: Math.max(0, Math.min(1, opacity)),
                        locked: false,
                        hidden: false,
                        zIndex: toNumber(element.order || element.zIndex, elemIndex), // 优先使用order字段，回退到zIndex或索引
                        name: element.name || `元素 ${elemIndex + 1}`,
                      };

                      // 根据元素类型设置特定属性
                      if (convertedElement.type === 'text') {
                        // 解析HTML内容
                        const parsedContent = get().parseHTMLContent(element.content || '');

                        // 根据行数调整元素高度
                        const lineCount = parsedContent.lineCount || 1;
                        const fontSize = Math.max(8, (parsedContent.fontSize || 10) * scaleY);
                        const lineHeight = 1.5;
                        const adjustedHeight = Math.max(convertedElement.height || 50, fontSize * lineHeight * lineCount + 10); // 10px padding

                        convertedElement.height = adjustedHeight;
                        convertedElement.text = {
                          content: parsedContent.content,
                          fontSize: fontSize,
                          fontFamily: parsedContent.fontFamily,
                          color: parsedContent.color,
                          bold: parsedContent.bold,
                          italic: parsedContent.italic,
                          underline: false,
                          strikethrough: false,
                          align: parsedContent.align,
                          lineHeight: lineHeight,
                          letterSpacing: 0,
                        };
                      } else if (convertedElement.type === 'shape') {
                        // 处理渐变填充
                        let fillColor = 'transparent';
                        let gradient = undefined;

                        if (element.fill) {
                          if (element.fill.type === 'gradient' && element.fill.gradient) {
                            const grad = element.fill.gradient;
                            gradient = {
                              type: grad.type === 'radial' ? 'radial' as const : 'linear' as const,
                              colors: grad.colors || ['transparent', 'transparent'],
                              angle: toNumber(grad.angle, 45),
                            };
                            fillColor = grad.colors?.[0] || 'transparent';
                          } else {
                            fillColor = get().extractColorFromFill(element.fill) || 'transparent';
                          }
                        }

                        // 处理shape中的文本内容
                        let shapeText = undefined;
                        if (element.content) {
                          const parsedContent = get().parseHTMLContent(element.content);
                          shapeText = {
                            content: parsedContent.content,
                            fontSize: parsedContent.fontSize || 16,
                            fontFamily: parsedContent.fontFamily || 'Arial',
                            color: parsedContent.color || 'transparent',
                            bold: parsedContent.bold || false,
                            italic: parsedContent.italic || false,
                            underline: false, // parseHTMLContent不包含这个属性
                            strikethrough: false, // parseHTMLContent不包含这个属性
                            align: parsedContent.align || 'center',
                            verticalAlign: element.vAlign === 'top' || element.vAlign === 'up' ? 'top' :
                                           element.vAlign === 'bottom' || element.vAlign === 'down' ? 'bottom' : 'middle',
                            lineHeight: 1.2, // parseHTMLContent不包含这个属性
                            letterSpacing: 0, // parseHTMLContent不包含这个属性
                          };
                        }

                        // 检测是否为路径形状
                        const shouldBePathShape = !!element.path || isPathShape(element.shapType || '');

                        // 处理特殊情况：如果shapType是line类型，但被识别为shape，则转换为line元素
                        if ((element.shapType || element.type)?.toLowerCase() === 'line') {
                          // 将这个元素重新设置为line类型
                          convertedElement.type = 'line';
                          convertedElement.line = {
                            type: 'straight',
                            stroke: element.borderColor || element.border?.color || '#374151',
                            strokeWidth: Math.max(1, toNumber(element.borderWidth || element.border?.width, 2) * Math.min(scaleX, scaleY)),
                            strokeDasharray: element.borderStrokeDasharray || '',
                            startMarker: 'none',
                            endMarker: 'none',
                            points: [
                              { x: 0, y: convertedElement.height / 2 },
                              { x: convertedElement.width, y: convertedElement.height / 2 }
                            ],
                          };
                        } else if ((element.shapType || element.type)?.toLowerCase() === 'custom' || 
                                   (element.shapType || element.type)?.toLowerCase() === 'arc') {
                          // 处理custom和arc类型的特殊情况
                          const isRoundRect = (element.shapType || element.type)?.toLowerCase().includes('round');
                          const borderRadius = isRoundRect ? 
                            toNumber(element.borderRadius || element.cornerRadius || element.roundness, 8) * Math.min(scaleX, scaleY) : 
                            0;

                          // 处理阴影属性
                          const shadow = element.shadow ? {
                            h: toNumber(element.shadow.h, 0) * Math.min(scaleX, scaleY),
                            v: toNumber(element.shadow.v, 0) * Math.min(scaleX, scaleY),
                            blur: toNumber(element.shadow.blur, 0) * Math.min(scaleX, scaleY),
                            color: element.shadow.color || '#00000066',
                          } : undefined;

                          convertedElement.shape = {
                            type: (element.shapType || element.type)?.toLowerCase() === 'arc' ? 'custom' : 'custom', // arc和custom都映射为custom类型
                            fill: fillColor,
                            stroke: element.borderColor || element.border?.color || '#4F46E5',
                            strokeWidth: Math.max(0, toNumber(element.borderWidth || element.border?.width, 0) * Math.min(scaleX, scaleY)),
                            borderRadius: borderRadius, // 设置圆角半径
                            gradient: gradient,
                            path: element.path, // 保存SVG路径数据（用于custom类型）
                            shapType: element.shapType, // 保存原始形状类型
                            isPathShape: true, // custom类型都是路径形状
                            shadow: shadow, // 阴影效果
                            isFlipH: element.isFlipH || false, // 水平翻转
                            isFlipV: element.isFlipV || false, // 垂直翻转
                            text: shapeText,
                          };
                        } else {
                          // 处理其他类型的圆角属性
                          const isRoundRect = (element.shapType || element.type)?.toLowerCase().includes('round');
                          const borderRadius = isRoundRect ? 
                            toNumber(element.borderRadius || element.cornerRadius || element.roundness, 8) * Math.min(scaleX, scaleY) : 
                            0;

                          // 处理阴影属性
                          const shadow = element.shadow ? {
                            h: toNumber(element.shadow.h, 0) * Math.min(scaleX, scaleY),
                            v: toNumber(element.shadow.v, 0) * Math.min(scaleX, scaleY),
                            blur: toNumber(element.shadow.blur, 0) * Math.min(scaleX, scaleY),
                            color: element.shadow.color || '#00000066',
                          } : undefined;

                          convertedElement.shape = {
                            type: get().mapShapeType(element.shapType || element.type),
                            fill: fillColor,
                            stroke: element.borderColor || element.border?.color || '#4F46E5',
                            strokeWidth: Math.max(0, toNumber(element.borderWidth || element.border?.width, 0) * Math.min(scaleX, scaleY)),
                            borderRadius: borderRadius, // 设置圆角半径
                            gradient: gradient,
                            path: element.path, // 保存SVG路径数据（用于custom类型）
                            shapType: element.shapType, // 保存原始形状类型
                            isPathShape: shouldBePathShape, // 标记为路径形状
                            shadow: shadow, // 阴影效果
                            isFlipH: element.isFlipH || false, // 水平翻转
                            isFlipV: element.isFlipV || false, // 垂直翻转
                            text: shapeText,
                          };
                        }
                      } else if (convertedElement.type === 'image') {
                        // 处理图片滤镜效果
                        const filters = {
                          blur: toNumber(element.blur || element.filters?.blur, 0),
                          brightness: toNumber(element.brightness || element.filters?.brightness, 100),
                          contrast: toNumber(element.contrast || element.filters?.contrast, 100),
                          grayscale: toNumber(element.grayscale || element.filters?.grayscale, 0),
                          saturate: toNumber(element.saturate || element.filters?.saturate, 100),
                          hue: toNumber(element.hue || element.filters?.hue, 0),
                        };

                        convertedElement.image = {
                          src: element.src || element.image?.src || '',
                          alt: element.alt || element.name || '',
                          filters: filters,
                          borderRadius: toNumber(element.borderRadius || element.cornerRadius, 0),
                          clipPath: element.clipPath,
                        };
                      } else if (convertedElement.type === 'table') {
                        // 处理表格数据，保留原始的复杂格式
                        const tableData = element.data || [];
                        const rowHeights = element.rowHeights || [];
                        const colWidths = element.colWidths || [];

                        // 处理表格单元格数据，保留HTML和样式信息
                        const processedData = tableData.map((row: any[]) => {
                          return row.map((cell: any) => {
                            if (typeof cell === 'string') {
                              return { text: cell };
                            }
                            return cell; // 保留原始复杂格式
                          });
                        });

                        convertedElement.table = {
                          rows: tableData.length || 3,
                          cols: tableData[0]?.length || 3,
                          data: processedData,
                          rowHeights: rowHeights,
                          colWidths: colWidths,
                          cellStyle: {
                            fontSize: 12,
                            color: '#000000',
                            backgroundColor: '#FFFFFF',
                            align: 'left',
                            bold: false,
                            italic: false,
                          },
                          borderStyle: {
                            width: 1,
                            color: '#E5E7EB',
                            style: 'solid',
                          },
                        };
                      } else if (convertedElement.type === 'chart') {
                        convertedElement.chart = {
                          type: get().mapChartType(element.chartType),
                          data: element.data || [],
                          theme: 'default',
                          options: {},
                        };
                      } else if (convertedElement.type === 'group') {
                        // 🚨 修复数据重复问题：不再保留原始的elements数组，避免数据重复存储
                        // (convertedElement as any).elements = element.elements || []; // 删除这行避免重复
                        
                        console.log(`🔍 处理group元素: ${element.name || 'unnamed'}, 子元素数量: ${element.elements?.length || 0}`);

                        // 递归处理子元素
                        if (element.elements && Array.isArray(element.elements)) {
                          const groupedElements: PPTElement[] = [];
                          
                          // 检查原始子元素数据大小
                          const originalChildrenSize = JSON.stringify(element.elements).length;
                          console.log(`  📊 原始子元素数据大小: ${(originalChildrenSize / 1024).toFixed(2)}KB`);

                          element.elements.forEach((childElement: any) => {
                            // 递归转换子元素
                            const childType = get().mapElementType(childElement.type);
                            const childId = nanoid();

                            // 子元素使用相对于group的坐标
                            const childX = toNumber(childElement.left || childElement.x, 0);
                            const childY = toNumber(childElement.top || childElement.y, 0);
                            const childWidth = toNumber(childElement.width || childElement.w, 100);
                            const childHeight = toNumber(childElement.height || childElement.h, 50);

                            const convertedChild: PPTElement = {
                              id: childId,
                              type: childType,
                              x: childX,
                              y: childY,
                              width: childWidth,
                              height: childHeight,
                              rotation: toNumber(childElement.rotate || childElement.rotation || childElement.angle, 0),
                              opacity: toNumber(childElement.opacity || childElement.alpha, 1),
                              locked: false,
                              hidden: false,
                              zIndex: toNumber(childElement.order || childElement.zIndex, 0),
                              name: childElement.name || `${childType}_${childId.substring(0, 8)}`,
                            };

                            // 根据子元素类型设置特定属性（复用上面的逻辑）
                            if (convertedChild.type === 'text') {
                              const parsedContent = get().parseHTMLContent(childElement.content || '');

                              // 根据行数调整子元素高度
                              const lineCount = parsedContent.lineCount || 1;
                              const fontSize = Math.max(8, parsedContent.fontSize || 16);
                              const lineHeight = 1.5;
                              const adjustedHeight = Math.max(convertedChild.height || 50, fontSize * lineHeight * lineCount + 10); // 10px padding

                              convertedChild.height = adjustedHeight;
                              convertedChild.text = {
                                content: parsedContent.content,
                                fontSize: fontSize,
                                fontFamily: parsedContent.fontFamily,
                                color: parsedContent.color,
                                bold: parsedContent.bold,
                                italic: parsedContent.italic,
                                underline: false,
                                strikethrough: false,
                                align: parsedContent.align,
                                lineHeight: lineHeight,
                                letterSpacing: 0,
                              };
                            } else if (convertedChild.type === 'shape') {
                              let fillColor = 'transparent';
                              if (childElement.fill) {
                                if (childElement.fill.type === 'color') {
                                  fillColor = childElement.fill.value || 'transparent';
                                } else {
                                  fillColor = get().extractColorFromFill(childElement.fill) || 'transparent';
                                }
                              }

                              let shapeText = undefined;
                              if (childElement.content) {
                                const parsedContent = get().parseHTMLContent(childElement.content);

                                // 如果检测到多行文本，调整shape子元素高度
                                const lineCount = parsedContent.lineCount || 1;
                                if (lineCount > 1) {
                                  const fontSize = parsedContent.fontSize || 16;
                                  const lineHeight = 1.2;
                                  const adjustedHeight = Math.max(convertedChild.height || 50, fontSize * lineHeight * lineCount + 20); // 20px padding
                                  convertedChild.height = adjustedHeight;
                                }

                                shapeText = {
                                  content: parsedContent.content,
                                  fontSize: parsedContent.fontSize || 16,
                                  fontFamily: parsedContent.fontFamily || 'Arial',
                                  color: parsedContent.color || '#000000',
                                  bold: parsedContent.bold || false,
                                  italic: parsedContent.italic || false,
                                  underline: false,
                                  strikethrough: false,
                                  align: parsedContent.align || 'center',
                                  verticalAlign: 'middle' as const,
                                  lineHeight: 1.2,
                                  letterSpacing: 0,
                                };
                              }

                              // 检测是否为路径形状
                              const shouldBePathShape = !!childElement.path || isPathShape(childElement.shapType || '');

                              // 处理特殊情况：如果shapType是line类型，但被识别为shape，则转换为line元素
                              if ((childElement.shapType || childElement.type)?.toLowerCase() === 'line') {
                                // 将这个子元素重新设置为line类型
                                convertedChild.type = 'line';
                                convertedChild.line = {
                                  type: 'straight',
                                  stroke: childElement.borderColor || '#374151',
                                  strokeWidth: Math.max(1, toNumber(childElement.borderWidth, 2)),
                                  strokeDasharray: childElement.borderStrokeDasharray || '',
                                  startMarker: 'none',
                                  endMarker: 'none',
                                  points: [
                                    { x: 0, y: convertedChild.height / 2 },
                                    { x: convertedChild.width, y: convertedChild.height / 2 }
                                  ],
                                };
                              } else {
                                // 检测子元素是否为 custom 或 arc 类型需要特殊处理
                                if ((childElement.shapType || childElement.type)?.toLowerCase() === 'custom' || 
                                    (childElement.shapType || childElement.type)?.toLowerCase() === 'arc') {
                                  // 处理custom和arc类型的子元素，直接设置为custom类型避免mapShapeType错误
                                  
                                  // 处理子元素的圆角属性
                                  const isChildRoundRect = (childElement.shapType || childElement.type)?.toLowerCase().includes('round');
                                  const childBorderRadius = isChildRoundRect ? 
                                    toNumber(childElement.borderRadius || childElement.cornerRadius || childElement.roundness, 8) : 
                                    0;

                                  // 处理子元素的阴影属性
                                  const childShadow = childElement.shadow ? {
                                    h: toNumber(childElement.shadow.h, 0),
                                    v: toNumber(childElement.shadow.v, 0),
                                    blur: toNumber(childElement.shadow.blur, 0),
                                    color: childElement.shadow.color || '#00000066',
                                  } : undefined;

                                  convertedChild.shape = {
                                    type: 'custom', // 直接设置为custom类型，不通过mapShapeType
                                    fill: fillColor,
                                    stroke: childElement.borderColor || '#4F46E5',
                                    strokeWidth: toNumber(childElement.borderWidth, 0),
                                    borderRadius: childBorderRadius,
                                    path: childElement.path, // 保存SVG路径数据
                                    shapType: childElement.shapType, // 保存原始形状类型
                                    isPathShape: true, // custom类型都是路径形状
                                    shadow: childShadow, // 阴影效果
                                    isFlipH: childElement.isFlipH || false, // 水平翻转
                                    isFlipV: childElement.isFlipV || false, // 垂直翻转
                                    text: shapeText,
                                  };
                                } else {
                                  // 处理子元素的圆角属性
                                  const isChildRoundRect = (childElement.shapType || childElement.type)?.toLowerCase().includes('round');
                                  const childBorderRadius = isChildRoundRect ? 
                                    toNumber(childElement.borderRadius || childElement.cornerRadius || childElement.roundness, 8) : 
                                    0;

                                  // 处理子元素的阴影属性
                                  const childShadow = childElement.shadow ? {
                                    h: toNumber(childElement.shadow.h, 0),
                                    v: toNumber(childElement.shadow.v, 0),
                                    blur: toNumber(childElement.shadow.blur, 0),
                                    color: childElement.shadow.color || '#00000066',
                                  } : undefined;

                                  convertedChild.shape = {
                                    type: get().mapShapeType(childElement.shapType || childElement.type),
                                    fill: fillColor,
                                    stroke: childElement.borderColor || '#4F46E5',
                                    strokeWidth: toNumber(childElement.borderWidth, 0),
                                    borderRadius: childBorderRadius, // 设置子元素圆角半径
                                    path: childElement.path, // 保存SVG路径数据（用于custom类型）
                                    shapType: childElement.shapType, // 保存原始形状类型
                                    isPathShape: shouldBePathShape, // 标记为路径形状
                                    shadow: childShadow, // 阴影效果
                                    isFlipH: childElement.isFlipH || false, // 水平翻转
                                    isFlipV: childElement.isFlipV || false, // 垂直翻转
                                    text: shapeText,
                                  };
                                }
                              }
                            } else if (convertedChild.type === 'image') {
                              convertedChild.image = {
                                src: childElement.src || childElement.image?.src || '',
                                alt: childElement.alt || childElement.name || '',
                                filters: {
                                  blur: 0,
                                  brightness: 100,
                                  contrast: 100,
                                  grayscale: 0,
                                  saturate: 100,
                                  hue: 0,
                                },
                                borderRadius: 0,
                              };
                            } else if (convertedChild.type === 'line') {
                              convertedChild.line = {
                                type: childElement.lineType || 'straight',
                                stroke: childElement.stroke || childElement.borderColor || '#374151',
                                strokeWidth: toNumber(childElement.strokeWidth || childElement.borderWidth, 2),
                                strokeDasharray: childElement.strokeDasharray || '',
                                startMarker: childElement.startMarker || 'none',
                                endMarker: childElement.endMarker || 'none',
                                points: childElement.points || [
                                  { x: 0, y: childHeight / 2 },
                                  { x: childWidth, y: childHeight / 2 }
                                ],
                              };
                            } else if (convertedChild.type === 'chart') {
                              convertedChild.chart = {
                                type: get().mapChartType(childElement.chartType),
                                data: childElement.data || childElement.chartData || [],
                                theme: childElement.theme || 'default',
                                options: childElement.options || childElement.chartOptions || {},
                              };
                            } else if (convertedChild.type === 'table') {
                              convertedChild.table = {
                                rows: childElement.rows || childElement.data?.length || 3,
                                cols: childElement.cols || childElement.data?.[0]?.length || 3,
                                data: childElement.data || [],
                                cellStyle: childElement.cellStyle || {
                                  fontSize: 12,
                                  color: '#000000',
                                  backgroundColor: '#FFFFFF',
                                  align: 'left',
                                  bold: false,
                                  italic: false,
                                },
                                headerStyle: childElement.headerStyle,
                                borderStyle: childElement.borderStyle || {
                                  width: 1,
                                  color: '#E5E7EB',
                                  style: 'solid',
                                },
                              };
                            } else if (convertedChild.type === 'latex') {
                              convertedChild.latex = {
                                formula: childElement.formula || childElement.content || '',
                                color: childElement.color || '#059669',
                                size: toNumber(childElement.size || childElement.fontSize, 16),
                              };
                            } else if (convertedChild.type === 'video') {
                              convertedChild.media = {
                                src: childElement.src || childElement.media?.src || '',
                                autoplay: childElement.autoplay || false,
                                loop: childElement.loop || false,
                                controls: childElement.controls !== false,
                                poster: childElement.poster,
                              };
                            } else if (convertedChild.type === 'audio') {
                              convertedChild.media = {
                                src: childElement.src || childElement.media?.src || '',
                                autoplay: childElement.autoplay || false,
                                loop: childElement.loop || false,
                                controls: childElement.controls !== false,
                              };
                            } else if (convertedChild.type === 'group') {
                              // 根据规则2：Group和Group的组合，直接合并Group下所有的元素
                              // 所以这里需要展平嵌套的group
                              console.warn('⚠️ Found nested group in group, flattening according to rules');

                              if (childElement.elements && Array.isArray(childElement.elements)) {
                                // 递归处理嵌套group的子元素，并直接添加到当前group中
                                childElement.elements.forEach((nestedElement: any) => {
                                  const nestedType = get().mapElementType(nestedElement.type);
                                  const nestedId = nanoid();

                                  // 计算嵌套元素相对于最外层group的坐标
                                  const nestedX = childX + toNumber(nestedElement.left || nestedElement.x, 0);
                                  const nestedY = childY + toNumber(nestedElement.top || nestedElement.y, 0);

                                  const nestedChild: PPTElement = {
                                    id: nestedId,
                                    type: nestedType,
                                    x: nestedX,
                                    y: nestedY,
                                    width: toNumber(nestedElement.width || nestedElement.w, 100),
                                    height: toNumber(nestedElement.height || nestedElement.h, 50),
                                    rotation: toNumber(nestedElement.rotate || nestedElement.rotation || nestedElement.angle, 0),
                                    opacity: toNumber(nestedElement.opacity || nestedElement.alpha, 1),
                                    locked: false,
                                    hidden: false,
                                    zIndex: toNumber(nestedElement.order || nestedElement.zIndex, 0),
                                    name: nestedElement.name || `${nestedType}_${nestedId.substring(0, 8)}`,
                                  };

                                  // 这里可以复用上面的类型处理逻辑
                                  // 为了简化，这里只展示结构，实际应该根据类型设置对应属性

                                  groupedElements.push(nestedChild);
                                });

                                // 跳过当前的group元素，因为它的子元素已经被展平添加了
                                return;
                              }
                            }

                            // 只有非group类型的子元素才添加到groupedElements中
                            if (convertedChild.type !== 'group') {
                              groupedElements.push(convertedChild);
                            }
                          });

                          // 设置转换后的子元素数组
                          convertedElement.groupedElements = groupedElements;
                          
                          // 检查转换后子元素数据大小
                          const convertedChildrenSize = JSON.stringify(groupedElements).length;
                          console.log(`  📊 转换后子元素数据大小: ${(convertedChildrenSize / 1024).toFixed(2)}KB`);
                          console.log(`  📈 子元素数据膨胀率: ${((convertedChildrenSize / originalChildrenSize) * 100).toFixed(1)}%`);
                        }

                        // 保留原始属性
                        (convertedElement as any).isFlipV = element.isFlipV || false;
                        (convertedElement as any).isFlipH = element.isFlipH || false;
                        (convertedElement as any).order = element.order || element.zIndex || 0;
                      }

                      return convertedElement;
                    }),
                    background: (() => {
                      console.log(`处理幻灯片 ${index + 1} 背景:`, {
                        fillType: slide.fill?.type,
                        fillValue: slide.fill?.value,
                        fillData: slide.fill
                      });
                      
                      if (slide.fill?.type === 'image') {
                        const imageValue = get().extractColorFromFill(slide.fill);
                        console.log(`幻灯片 ${index + 1} 图片背景值:`, imageValue);
                        
                        return {
                          type: 'image' as const,
                          value: imageValue !== 'transparent' ? imageValue : '#FFFFFF',
                          imageSize: slide.fill.value?.size || 'cover', // 支持图片尺寸设置
                          opacity: slide.fill.value?.opacity || 1, // 支持透明度
                        };
                      } else if (slide.fill?.type === 'gradient') {
                        return {
                          type: 'gradient' as const,
                          value: slide.fill.gradient ? 
                            `linear-gradient(${slide.fill.gradient.angle || 45}deg, ${slide.fill.gradient.colors?.join(', ') || '#FFFFFF, #FFFFFF'})` :
                            'linear-gradient(45deg, #FFFFFF, #FFFFFF)',
                        };
                      } else {
                        return {
                          type: 'color' as const,
                          value: get().extractColorFromFill(slide.fill) || '#FFFFFF'
                        };
                      }
                    })(),
                    transition: { type: 'none', duration: 500 },
                    notes: slide.note || '',
                    tags: [],
                  };
                });

                // 检查转换后数据大小
                const convertedDataSize = JSON.stringify(convertedSlides).length;
                console.log(`📊 转换后数据大小: ${(convertedDataSize / 1024).toFixed(2)}KB`);
                console.log(`📈 数据膨胀率: ${((convertedDataSize / originalDataSize) * 100).toFixed(1)}%`);
                
                if (convertedDataSize > originalDataSize * 2) {
                  console.warn(`⚠️ 数据膨胀异常: 原始${(originalDataSize / 1024).toFixed(2)}KB → 转换后${(convertedDataSize / 1024).toFixed(2)}KB`);
                }

                set({
                  title: file.name.replace(/\.(pptx?|json)$/i, ''),
                  slides: convertedSlides,
                  activeSlideIndex: 0,
                  currentTheme: DEFAULT_THEME,
                  activeElementIds: [],
                  historySnapshots: [],
                  currentSnapshotIndex: -1,
                });

                // 创建快照（如果失败也不影响导入）
                try {
                  get().createSnapshot('导入PPTX文件');
                } catch (error) {
                  console.warn('快照创建失败，但PPTX导入成功:', error);
                }
                
                // 触发画布居中
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('resetCanvasView'));
                }, 100);
                
                resolve();
              } else {
                throw new Error('PPTX文件格式无效或没有幻灯片内容');
              }
            } catch (parseError) {
              console.error('PPTX解析失败:', parseError);
              throw new Error(`PPTX解析失败: ${parseError instanceof Error ? parseError.message : '未知错误'}`);
            }
          } catch (error) {
            console.error('PPTX导入处理失败:', error);
            reject(error);
          }
        };

        reader.onerror = () => {
          reject(new Error('文件读取失败'));
        };

        // 读取文件为ArrayBuffer
        reader.readAsArrayBuffer(file);
      });
    } catch (error) {
      console.error('PPTX import failed:', error);
      throw error;
    }
  },

  async importFromJSON(data: any) {
    if (data.slides && Array.isArray(data.slides)) {
      // 使用FileImporter处理复杂表格数据
      const { fileImporter } = await import('../utils/import-utils');

      try {
        // 创建一个临时文件对象来使用FileImporter的JSON处理逻辑
        const jsonString = JSON.stringify(data);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const file = new File([blob], 'temp.json', { type: 'application/json' });

        // FileImporter没有importFile方法，直接使用原数据
        const result = { slides: data.slides, title: data.title, theme: data.theme };

        set({
          title: result.title || data.title || '导入的演示文稿',
          slides: result.slides,
          activeSlideIndex: 0,
          currentTheme: result.theme || data.theme || DEFAULT_THEME,
          activeElementIds: [],
          historySnapshots: [], // 清空历史记录
          currentSnapshotIndex: -1,
        });
      } catch (error) {
        console.error('❌ JSON import with parsing failed, using fallback:', error);
        console.error('Error details:', error instanceof Error ? error.message : error);
        // 如果解析失败，使用原来的逻辑作为后备
        set({
          title: data.title || '导入的演示文稿',
          slides: data.slides,
          activeSlideIndex: 0,
          currentTheme: data.theme || DEFAULT_THEME,
          activeElementIds: [],
          historySnapshots: [], // 清空历史记录
          currentSnapshotIndex: -1,
        });
      }

      get().createSnapshot('导入JSON文件');
    } else {
      throw new Error('无效的JSON格式');
    }
  },

  async printSlides(layout: 'slides' | 'handouts' | 'notes', slidesPerPage: number = 6) {
    try {
      const state = get();
      await exportService.printSlides(state.slides, state.title, {
        layout,
        slidesPerPage,
        includeNotes: layout === 'notes',
      });
    } catch (error) {
      console.error('打印失败:', error);
      alert('打印功能暂时不可用，请使用导出功能');
      throw error;
    }
  },

  // 手动保存当前状态（用于保存按钮和Ctrl+S）
  async saveCurrentState() {
    const state = get();
    console.log('🔄 手动保存触发');
    await saveStateToStorage(state);
  },

  // 启用自动保存（仅定时保存）
  enableAutoSave() {
    AUTO_SAVE_CONFIG.enabled = true;
    startAutoSave(() => get());
    console.log('✅ 定时保存已启用 (60秒间隔)');
  },

  // 禁用自动保存
  disableAutoSave() {
    AUTO_SAVE_CONFIG.enabled = false;
    stopAutoSave();
    console.log('❌ 定时保存已禁用');
  },

  // 获取存储信息
  async getStorageInfo() {
    const sm = await getStorageManager();
    return await sm.getStorageInfo();
  },

  // 清除存储数据
  async clearStorageData() {
    const sm = await getStorageManager();
    await sm.clear();
    stopAutoSave();
  },

  // 资源管理功能实现
  async addImageFromFile(file: File, elementProperties?: Partial<PPTElement>) {
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const base64 = await base64Promise;
      
      const state = get();
      const currentSlide = state.slides[state.activeSlideIndex];
      if (!currentSlide) return;

      const imageElement: Omit<PPTElement, 'id'> = {
        type: 'image',
        x: 100,
        y: 100,
        width: 300,
        height: 200,
        rotation: 0,
        opacity: 1,
        locked: false,
        hidden: false,
        zIndex: 0,
        image: {
          src: base64,
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
        ...elementProperties,
      };

      await get().addElement(imageElement);
    } catch (error) {
      console.error('添加图片失败:', error);
      throw error;
    }
  },

  async addImageFromUrl(url: string, elementProperties?: Partial<PPTElement>) {
    try {
      // 将URL转换为base64
      const response = await fetch(url);
      const blob = await response.blob();
      const reader = new FileReader();
      
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const base64 = await base64Promise;
      
      const state = get();
      const currentSlide = state.slides[state.activeSlideIndex];
      if (!currentSlide) return;

      const imageElement: Omit<PPTElement, 'id'> = {
        type: 'image',
        x: 100,
        y: 100,
        width: 300,
        height: 200,
        rotation: 0,
        opacity: 1,
        locked: false,
        hidden: false,
        zIndex: 0,
        image: {
          src: base64,
          alt: 'Imported Image',
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
        ...elementProperties,
      };

      await get().addElement(imageElement);
    } catch (error) {
      console.error('从URL添加图片失败:', error);
      throw error;
    }
  },

  async replaceElementImage(elementId: string, newImageSrc: string) {
    try {
      const state = get();
      const currentSlide = state.slides[state.activeSlideIndex];
      if (!currentSlide) return;

      const element = currentSlide.elements.find(el => el.id === elementId);
      if (!element || element.type !== 'image') return;

      await get().updateElement(elementId, {
        image: {
          ...element.image,
          src: newImageSrc,
        },
      });
    } catch (error) {
      console.error('替换图片失败:', error);
      throw error;
    }
  },

  async getResourceStorageStats() {
    try {
      const rm = await getResourceManager();
      return await rm.getStorageStats();
    } catch (error) {
      console.error('获取资源存储统计失败:', error);
      return {
        totalResources: 0,
        totalSize: 0,
        unusedResources: 0,
        resourcesByType: {},
      };
    }
  },
})));

// 订阅状态变更的自动保存已禁用
// 现在只支持手动保存和定时保存
/*
usePPTStore.subscribe(
  (state) => state,
  (state) => {
    // 只有在有有效幻灯片时才保存
    if (state.slides.length > 0 && !isSaving && AUTO_SAVE_CONFIG.enableDebouncedSave) {
      debouncedSave(state);
    }
  },
  {
    // 只在这些字段变更时触发保存
    equalityFn: (a, b) =>
      a.title === b.title &&
      a.slides === b.slides &&
      a.currentTheme === b.currentTheme &&
      a.showGrid === b.showGrid &&
      a.showRuler === b.showRuler &&
      a.gridSize === b.gridSize &&
      a.thumbnailsWidth === b.thumbnailsWidth &&
      a.toolbarWidth === b.toolbarWidth &&
      a.remarkHeight === b.remarkHeight &&
      a.showThumbnails === b.showThumbnails &&
      a.showToolbar === b.showToolbar &&
      a.showRemark === b.showRemark
  }
);
*/

// 在页面卸载时保存状态
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', async () => {
    try {
      const state = usePPTStore.getState();
      if (state.slides.length > 0) {
        await saveStateToStorage(state);
        console.log('💾 页面卸载前状态已保存');
      }
    } catch (error) {
      console.warn('页面卸载保存失败:', error);
    }
  });

  // 页面可见性变化时的自动保存已禁用
  // 现在只在页面卸载时保存，避免过度的自动保存
  /*
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      try {
        const state = usePPTStore.getState();
        if (state.slides.length > 0) {
          saveStateToStorage(state);
          console.log('💾 页面隐藏时状态已保存');
        }
      } catch (error) {
        console.warn('页面隐藏保存失败:', error);
      }
    }
  });
  */

  // 添加Ctrl+S快捷键支持
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      const state = usePPTStore.getState();
      state.saveCurrentState().catch(error => {
        console.error('快捷键保存失败:', error);
      });
    }
  });
}