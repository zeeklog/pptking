# Layout Elements 层级优化实现

## 问题分析

原始逻辑将 `layoutElements` 和 `elements` 合并是正确的，但存在层级问题：
- 之前仅按元素类型排序，没有区分元素来源
- 导致 `layoutElements` 中的文本可能显示在普通元素之上

## 解决方案

### 1. 元素标记策略

为每个元素添加临时标记 `_isLayoutElement`：
```typescript
const layoutElementsWithTag = (slide.layoutElements || []).map((element: any) => ({
  ...element,
  _isLayoutElement: true
}));

const elementsWithTag = (slide.elements || []).map((element: any) => ({
  ...element,
  _isLayoutElement: false
}));
```

### 2. 分层排序逻辑

```typescript
allElements.sort((a, b) => {
  // 首先按是否为layoutElement排序
  if (a._isLayoutElement !== b._isLayoutElement) {
    return a._isLayoutElement ? -1 : 1; // layoutElement优先级更高（更靠前，即更底层）
  }
  
  // 同类型元素内部按元素类型排序
  const getElementPriority = (element: any) => {
    switch (element.type) {
      case 'image': return 1; // 图片背景最底层
      case 'shape': return 2; // 形状中层
      case 'line': return 3;  // 线条上层
      case 'chart': return 4; // 图表上层
      case 'table': return 5; // 表格上层
      case 'group': return 5; // 组合元素上层
      case 'text': return 6;  // 文字最上层
      default: return 3;
    }
  };
  return getElementPriority(a) - getElementPriority(b);
});
```

### 3. zIndex 差异化

```typescript
zIndex: element._isLayoutElement ? 
  get().calculateElementZIndex(element.type, elemIndex) - 1000 : // layoutElement的zIndex更低
  get().calculateElementZIndex(element.type, elemIndex),
```

### 4. 元素命名标识

```typescript
name: element.name || `${element._isLayoutElement ? '母版' : ''}元素 ${elemIndex + 1}`,
```

### 5. 清理临时标记

在转换完成后清理临时标记：
```typescript
delete (element as any)._isLayoutElement;
```

## 层级效果

最终的元素层级从底到顶：

1. **layoutElements 区域** (zIndex: -1000 ~ -500)
   - 母版图片元素 (最底层)
   - 母版形状元素
   - 母版线条元素
   - 母版表格元素
   - 母版组合元素
   - 母版文字元素

2. **elements 区域** (zIndex: 0 ~ 500)
   - 内容图片元素
   - 内容形状元素
   - 内容线条元素
   - 内容表格元素
   - 内容组合元素
   - 内容文字元素 (最顶层)

## 调试信息

添加了详细的日志输出：
```typescript
console.log(`幻灯片 ${index + 1} 合并后元素统计:`, {
  totalElements: allElements.length,
  layoutElements: layoutElementsWithTag.length,
  contentElements: elementsWithTag.length
});
```

## 验证方法

1. 导入包含 `layoutElements` 的 PPTX 文件
2. 检查控制台日志，确认元素统计正确
3. 观察画布渲染，确认 layoutElements 在底层
4. 查看元素名称，确认"母版"标识

## 注意事项

- 临时标记在转换完成后会被清理
- zIndex 计算保持了原有逻辑的一致性
- 元素类型内部的排序逻辑保持不变
- 完全向后兼容现有的导入功能
