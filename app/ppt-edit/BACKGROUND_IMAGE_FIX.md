# PPTX导入base64背景图片修复

## 问题描述
PPTX导入功能在处理包含base64背景图片的幻灯片时，无法正确解析和渲染背景图片。导入的JSON数据结构如下：

```json
{
  "fill": {
    "type": "image",
    "value": {
      "picBase64": "data:image/png;base64,iVBORw0KGg0...",
      "opacity": 1
    }
  }
}
```

## 修复方案

### 1. 更新 `extractColorFromFill` 函数
- 位置：`app/ppt-edit/store/ppt-store.ts`
- 修复：支持从 `fill.value.picBase64` 提取base64图片数据
- 变更：对于图片类型填充，返回实际的图片数据而不是 `'transparent'`

### 2. 更新幻灯片背景处理逻辑
- 位置：`app/ppt-edit/store/ppt-store.ts` 的 `importFromPPTX` 方法
- 修复：正确处理图片类型背景，包括base64数据和透明度
- 新增：支持 `imageSize` 和 `opacity` 属性

### 3. 更新类型定义
- 位置：`PPTSlide` 接口
- 新增：`opacity` 属性支持背景透明度

### 4. 更新渲染组件
以下组件已更新以支持新的背景属性：
- `Canvas.tsx` - 主画布渲染
- `Thumbnails.tsx` - 缩略图预览
- `PresentationMode.tsx` - 演示模式
- `SlideSorter.tsx` - 幻灯片排序器
- `export-utils.ts` - 导出功能

### 5. 新增调试日志
在导入过程中添加了详细的调试日志，帮助追踪背景处理过程。

## 支持的背景格式
- **颜色背景**: `{ type: 'color', value: '#FFFFFF' }`
- **图片背景**: `{ type: 'image', value: 'data:image/...', imageSize: 'cover', opacity: 1 }`
- **渐变背景**: `{ type: 'gradient', value: 'linear-gradient(...)' }`

## 测试方法
1. 导入包含base64背景图片的PPTX文件
2. 检查控制台日志确认背景数据正确解析
3. 验证画布、缩略图和演示模式中背景图片正确显示
4. 测试导出功能是否保持背景图片

## 技术细节
- base64图片数据直接用作CSS `background-image` 的 `url()` 值
- 支持透明度控制通过CSS `opacity` 属性
- 支持多种背景尺寸：`cover`、`contain`、`repeat`
- 向后兼容现有的颜色和渐变背景
