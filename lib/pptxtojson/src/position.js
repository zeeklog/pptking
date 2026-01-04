import { RATIO_EMUs_Points } from './constants'

/**
 * 获取元素位置 - 展示PPTX层级继承机制的核心实现
 * 这个函数完美展示了PowerPoint的三级继承体系：
 * 1. Slide（幻灯片）- 最高优先级，当前幻灯片中的具体元素位置
 * 2. SlideLayout（幻灯片布局）- 中等优先级，布局模板中定义的位置
 * 3. SlideMaster（幻灯片母版）- 最低优先级，母版中定义的默认位置
 * 
 * @param {Object} slideSpNode - 当前幻灯片中元素的位置信息（最高优先级）
 * @param {Object} slideLayoutSpNode - 布局中对应元素的位置信息（中等优先级）
 * @param {Object} slideMasterSpNode - 母版中对应元素的位置信息（最低优先级）
 * @returns {Object} 包含top和left属性的位置对象
 */
export function getPosition(slideSpNode, slideLayoutSpNode, slideMasterSpNode) {
  let off

  // 层级继承查找：按优先级顺序查找位置信息
  // 这种机制确保了元素可以在不同层级中覆盖和继承样式
  if (slideSpNode) {
    // 优先使用当前幻灯片中的位置（如果用户在当前幻灯片中移动了元素）
    off = slideSpNode['a:off']['attrs']
  }
  else if (slideLayoutSpNode) {
    // 其次使用布局中定义的位置（布局模板中的默认位置）
    off = slideLayoutSpNode['a:off']['attrs']
  }
  else if (slideMasterSpNode) {
    // 最后使用母版中定义的位置（全局默认位置）
    off = slideMasterSpNode['a:off']['attrs']
  }

  // 如果三个层级都没有定义位置，则使用默认值
  if (!off) return { top: 0, left: 0 }

  // 将EMU单位转换为点单位并返回
  return {
    top: parseInt(off['y']) * RATIO_EMUs_Points,
    left: parseInt(off['x']) * RATIO_EMUs_Points,
  }
}

/**
 * 获取元素大小 - 同样遵循PPTX的层级继承机制
 * 与getPosition函数类似，按照相同的优先级顺序查找元素的大小信息
 * 这确保了元素的尺寸也可以在不同层级中进行覆盖和继承
 * 
 * @param {Object} slideSpNode - 当前幻灯片中元素的大小信息（最高优先级）
 * @param {Object} slideLayoutSpNode - 布局中对应元素的大小信息（中等优先级）
 * @param {Object} slideMasterSpNode - 母版中对应元素的大小信息（最低优先级）
 * @returns {Object} 包含width和height属性的尺寸对象
 */
export function getSize(slideSpNode, slideLayoutSpNode, slideMasterSpNode) {
  let ext

  // 层级继承查找：按优先级顺序查找大小信息
  if (slideSpNode) {
    // 优先使用当前幻灯片中的大小（如果用户在当前幻灯片中调整了元素大小）
    ext = slideSpNode['a:ext']['attrs']
  }
  else if (slideLayoutSpNode) {
    // 其次使用布局中定义的大小（布局模板中的默认大小）
    ext = slideLayoutSpNode['a:ext']['attrs']
  }
  else if (slideMasterSpNode) {
    // 最后使用母版中定义的大小（全局默认大小）
    ext = slideMasterSpNode['a:ext']['attrs']
  }

  // 如果三个层级都没有定义大小，则使用默认值
  if (!ext) return { width: 0, height: 0 }

  // 将EMU单位转换为点单位并返回
  return {
    width: parseInt(ext['cx']) * RATIO_EMUs_Points,
    height: parseInt(ext['cy']) * RATIO_EMUs_Points,
  }
}