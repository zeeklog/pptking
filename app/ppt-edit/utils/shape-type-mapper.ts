/**
 * PPTX形状类型映射工具
 * 基于 shapePath.js 分析的191种支持的形状类型
 * 将PPTX原始形状类型映射为项目中的标准形状类型
 * 
 * @example
 * ```typescript
 * import { mapShapeType, isPathShape } from './shape-type-mapper';
 * 
 * // 映射形状类型
 * const shapeType = mapShapeType('parallelogram'); // 'custom'
 * const arrowType = mapShapeType('upArrow'); // 'custom'
 * const rectType = mapShapeType('rect'); // 'rectangle'
 * 
 * // 检查是否需要SVG路径渲染
 * const needsPath = isPathShape('parallelogram'); // true
 * const rectNeedsPath = isPathShape('rect'); // false
 * ```
 * 
 * @see {@link ../../../lib/pptxtojson/src/shapePath.js} 形状路径生成器
 */

export type PPTShapeType = 'rectangle' | 'circle' | 'triangle' | 'diamond' | 'star' | 'custom';

/**
 * 完整的形状类型映射表
 * 支持191种PPTX形状类型，基于shapePath.js的实际支持情况
 */
const SHAPE_TYPE_MAPPING: Record<string, PPTShapeType> = {
  // 基础几何形状 - 矩形系列
  'rect': 'rectangle',
  'rectangle': 'rectangle',
  'actionbuttonblank': 'rectangle',
  'roundrect': 'rectangle',
  'round1rect': 'rectangle',
  'round2diagrect': 'rectangle',
  'round2samerect': 'rectangle',
  'snip1rect': 'rectangle',
  'snip2diagrect': 'rectangle',
  'snip2samerect': 'rectangle',
  'sniproundrect': 'rectangle',
  'frame': 'rectangle',
  'halfframe': 'rectangle',
  'plaque': 'rectangle',
  'foldedcorner': 'rectangle',
  'bevel': 'rectangle',

  // 圆形系列
  'ellipse': 'circle',
  'circle': 'circle',
  'pie': 'circle',
  'piewedge': 'circle',
  'arc': 'circle',
  'chord': 'circle',
  'donut': 'circle',
  'blockarc': 'circle',
  'moon': 'circle',
  'nosmoking': 'circle',

  // 三角形系列
  'triangle': 'triangle',
  'rttriangle': 'triangle',

  // 菱形系列
  'diamond': 'diamond',

  // 特殊四边形
  'parallelogram': 'custom', // 平行四边形 - 使用custom类型通过path渲染
  'trapezoid': 'custom', // 梯形
  'nonisoscelestrapezoid': 'custom', // 非等腰梯形

  // 多边形系列
  'pentagon': 'custom',
  'hexagon': 'custom',
  'heptagon': 'custom',
  'octagon': 'custom',
  'decagon': 'custom',
  'dodecagon': 'custom',

  // 星形系列
  'star': 'star',
  'star4': 'star',
  'star5': 'star',
  'star6': 'star',
  'star7': 'star',
  'star8': 'star',
  'star10': 'star',
  'star12': 'star',
  'star16': 'star',
  'star24': 'star',
  'star32': 'star',

  // 箭头形状系列 - 所有箭头都使用custom类型
  'uparrow': 'custom',
  'downarrow': 'custom',
  'leftarrow': 'custom',
  'rightarrow': 'custom',
  'leftrightarrow': 'custom',
  'updownarrow': 'custom',
  'quadarrow': 'custom',
  'leftrightuparrow': 'custom',
  'leftuparrow': 'custom',
  'bentuparrow': 'custom',
  'bentarrow': 'custom',
  'uturnarrow': 'custom',
  'stripedrightarrow': 'custom',
  'notchedrightarrow': 'custom',
  'curveddownarrow': 'custom',
  'curvedleftarrow': 'custom',
  'curvedrightarrow': 'custom',
  'curveduparrow': 'custom',
  'swoosharrow': 'custom',
  'circulararrow': 'custom',
  'leftcirculararrow': 'custom',
  'leftrightcirculararrow': 'custom',

  // 箭头标注系列
  'rightarrowcallout': 'custom',
  'downarrowcallout': 'custom',
  'leftarrowcallout': 'custom',
  'uparrowcallout': 'custom',
  'leftrightarrowcallout': 'custom',
  'quadarrowcallout': 'custom',
  'updownarrowcallout': 'custom',

  // 流程图形状系列
  'flowchartprocess': 'rectangle',
  'flowchartpredefinedprocess': 'custom',
  'flowchartinternalstorage': 'custom',
  'flowchartcollate': 'custom',
  'flowchartdocument': 'custom',
  'flowchartmultidocument': 'custom',
  'flowchartterminator': 'custom',
  'flowchartpunchedtape': 'custom',
  'flowchartonlinestorage': 'custom',
  'flowchartdisplay': 'custom',
  'flowchartdelay': 'custom',
  'flowchartmagnetictape': 'custom',
  'flowchartconnector': 'circle',
  'flowchartsummingjunction': 'circle',
  'flowchartor': 'circle',
  'flowchartalternateprocess': 'rectangle',
  'flowchartpunchedcard': 'custom',
  'flowchartextract': 'triangle',
  'flowchartmerge': 'triangle',
  'flowchartdecision': 'diamond',
  'flowchartsort': 'diamond',
  'flowchartmanualoperation': 'custom',
  'flowchartmanualinput': 'custom',
  'flowchartinputoutput': 'custom',
  'flowchartpreparation': 'custom',
  'flowchartoffpageconnector': 'custom',
  'flowchartofflinestorage': 'custom',
  'flowchartmagneticdisk': 'custom',
  'flowchartmagneticdrum': 'custom',

  // 动作按钮系列
  'actionbuttonbackprevious': 'custom',
  'actionbuttonbeginning': 'custom',
  'actionbuttondocument': 'custom',
  'actionbuttonend': 'custom',
  'actionbuttonforwardnext': 'custom',
  'actionbuttonhelp': 'custom',
  'actionbuttonhome': 'custom',
  'actionbuttoninformation': 'custom',
  'actionbuttonmovie': 'custom',
  'actionbuttonreturn': 'custom',
  'actionbuttonsound': 'custom',

  // 印章形状
  'irregularseal1': 'custom',
  'irregularseal2': 'custom',

  // 连接器系列
  'bentconnector2': 'custom',
  'bentconnector3': 'custom',
  'bentconnector4': 'custom',
  'bentconnector5': 'custom',
  'curvedconnector2': 'custom',
  'curvedconnector3': 'custom',
  'curvedconnector4': 'custom',
  'curvedconnector5': 'custom',
  'straightconnector1': 'custom',
  'line': 'custom',

  // 括号系列
  'bracepair': 'custom',
  'leftbrace': 'custom',
  'rightbrace': 'custom',
  'bracketpair': 'custom',
  'leftbracket': 'custom',
  'rightbracket': 'custom',

  // 装饰形状
  'corner': 'custom',
  'diagstripe': 'custom',
  'gear6': 'custom',
  'gear9': 'custom',
  'plus': 'custom',
  'teardrop': 'custom',
  'sun': 'custom',
  'heart': 'custom',
  'lightningbolt': 'custom',
  'cube': 'custom',
  'cloud': 'custom',
  'cloudcallout': 'custom',
  'smileyface': 'custom',

  // 滚动条形状
  'verticalscroll': 'custom',
  'horizontalscroll': 'custom',

  // 标注形状
  'wedgeellipsecallout': 'custom',
  'wedgerectcallout': 'custom',
  'wedgeroundrectcallout': 'custom',
  'accentbordercallout1': 'custom',
  'accentbordercallout2': 'custom',
  'accentbordercallout3': 'custom',
  'bordercallout1': 'custom',
  'bordercallout2': 'custom',
  'bordercallout3': 'custom',
  'accentcallout1': 'custom',
  'accentcallout2': 'custom',
  'accentcallout3': 'custom',
  'callout1': 'custom',
  'callout2': 'custom',
  'callout3': 'custom',

  // 功能区形状
  'leftrighribbon': 'custom',
  'ribbon': 'custom',
  'ribbon2': 'custom',
  'ellipseribbon': 'custom',
  'ellipseribbon2': 'custom',

  // 波浪形状
  'doublewave': 'custom',
  'wave': 'custom',

  // 数学符号
  'mathdivide': 'custom',
  'mathequal': 'custom',
  'mathminus': 'custom',
  'mathmultiply': 'custom',
  'mathnotequal': 'custom',
  'mathplus': 'custom',

  // 特殊形状
  'homeplate': 'custom',
  'chevron': 'custom',
  'can': 'custom',
  'chartplus': 'custom',
  'chartstar': 'custom',
  'chartx': 'custom',
  'cornertabs': 'custom',
  'foldercorner': 'custom',
  'funnel': 'custom',
  'lineinv': 'custom',
  'plaquetabs': 'custom',
  'squaretabs': 'custom',

  // 角度标记
  'cornr1': 'custom',
  'cornr2': 'custom',
  'cornrall': 'custom',
  'diag': 'custom',

  // 其他常见别名和变体
  'roundedrectangle': 'rectangle',
  'straight': 'custom',
  'curve': 'custom',
  'connector': 'custom',
  'custom': 'custom',
  'freeform': 'custom',
  'scribble': 'custom',
};

/**
 * 映射PPTX形状类型到项目标准类型
 * @param type PPTX原始形状类型
 * @returns 项目标准形状类型
 */
export function mapShapeType(type: string): PPTShapeType {
  if (!type) {
    return 'rectangle'; // 默认返回矩形
  }

  const normalizedType = type.toLowerCase().trim();
  const mappedType = SHAPE_TYPE_MAPPING[normalizedType];

  if (!mappedType) {
    // 开发环境下给出警告但不报错，方便调试
    if (process.env.NODE_ENV === 'development') {
      console.warn(`未知的形状类型: ${type}, 将使用矩形作为默认类型`);
    }
    return 'rectangle'; // 未知类型默认使用矩形
  }

  return mappedType;
}

/**
 * 检查形状类型是否需要使用SVG路径渲染
 * @param type PPTX原始形状类型
 * @returns 是否需要SVG路径渲染
 */
export function isPathShape(type: string): boolean {
  const mappedType = mapShapeType(type);
  return mappedType === 'custom';
}

/**
 * 获取所有支持的形状类型
 * @returns 支持的形状类型数组
 */
export function getSupportedShapeTypes(): string[] {
  return Object.keys(SHAPE_TYPE_MAPPING);
}

/**
 * 检查形状类型是否被支持
 * @param type 形状类型
 * @returns 是否支持
 */
export function isSupportedShapeType(type: string): boolean {
  return SHAPE_TYPE_MAPPING.hasOwnProperty(type.toLowerCase().trim());
}

/**
 * 统计信息
 */
export const SHAPE_MAPPING_STATS = {
  totalSupported: Object.keys(SHAPE_TYPE_MAPPING).length,
  byCategory: {
    rectangle: Object.values(SHAPE_TYPE_MAPPING).filter(t => t === 'rectangle').length,
    circle: Object.values(SHAPE_TYPE_MAPPING).filter(t => t === 'circle').length,
    triangle: Object.values(SHAPE_TYPE_MAPPING).filter(t => t === 'triangle').length,
    diamond: Object.values(SHAPE_TYPE_MAPPING).filter(t => t === 'diamond').length,
    star: Object.values(SHAPE_TYPE_MAPPING).filter(t => t === 'star').length,
    custom: Object.values(SHAPE_TYPE_MAPPING).filter(t => t === 'custom').length,
  }
};
