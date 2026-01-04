/**
 * PPT编辑器 z-index 层级管理
 * 
 * 层级规划：
 * - 编辑器基础层: 0-999
 * - PPT元素层: 1000-9999 (编辑器内的PPT元素)
 * - 编辑器UI层: 10000-19999 (工具栏、面板等)
 * - 弹窗层: 20000-29999 (对话框、弹窗)
 * - 顶级层: 30000+ (全局提示、错误信息等)
 */

export const Z_INDEX = {
  // 编辑器基础层 (0-999)
  EDITOR_BASE: 0,
  CANVAS_BACKGROUND: 1,
  GRID_LINES: 2,
  ALIGNMENT_LINES: 3,
  
  // PPT元素层 (1000-9999)
  PPT_ELEMENT_BASE: 1000,
  PPT_ELEMENT_MAX: 9999,
  
  // 编辑器UI层 (10000-19999)
  EDITOR_UI_BASE: 10000,
  THUMBNAILS: 10100,
  TOOLBAR: 10200,
  QUICK_ACTIONS: 10300,
  STATUS_BAR: 10400,
  CONTEXT_MENU: 10500,
  SELECTION_BOX: 10600,
  ELEMENT_HANDLES: 10700,
  
  // 弹窗层 (20000-29999)
  MODAL_BASE: 20000,
  DIALOG: 20100,
  DROPDOWN: 20200,
  TOOLTIP: 20300,
  PRESENTATION_MODE: 20400,
  AI_ASSISTANT: 20500,
  
  // 顶级层 (30000+)
  TOAST: 30000,
  GLOBAL_LOADING: 30100,
} as const;

/**
 * 获取PPT元素的z-index值
 * @param elementZIndex 元素在幻灯片中的相对z-index
 * @returns 绝对z-index值
 */
export function getPPTElementZIndex(elementZIndex: number): number {
  const clampedZIndex = Math.max(0, Math.min(elementZIndex, Z_INDEX.PPT_ELEMENT_MAX - Z_INDEX.PPT_ELEMENT_BASE));
  return Z_INDEX.PPT_ELEMENT_BASE + clampedZIndex;
}

/**
 * 确保PPT元素的z-index不会超出范围
 * @param elementZIndex 原始z-index
 * @returns 调整后的z-index
 */
export function clampPPTElementZIndex(elementZIndex: number): number {
  return Math.max(0, Math.min(elementZIndex, Z_INDEX.PPT_ELEMENT_MAX - Z_INDEX.PPT_ELEMENT_BASE));
}
