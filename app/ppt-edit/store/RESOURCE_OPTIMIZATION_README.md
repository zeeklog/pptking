# 资源存储优化方案

## 概述

为了解决 PPT 编辑器中图片 base64 数据重复存储导致的存储空间爆炸问题，我们实现了一套全新的资源管理系统。该系统将静态资源（图片、视频、音频）与状态数据分离存储，通过资源引用的方式大大减少存储空间占用。

## 问题背景

原始问题：
- 图片 base64 数据在每次保存状态时都会完整复制
- 相同图片被重复存储，造成存储空间浪费
- 存储数据过大，超过分片限制（336个块 > 200个块限制）

## 解决方案

### 1. 资源管理器 (ResourceManager)

**位置**: `app/ppt-edit/store/resource-manager.ts`

**功能**:
- 独立的 IndexedDB 存储，专门管理静态资源
- 基于内容哈希的去重机制，相同内容的资源只存储一份
- 引用计数管理，自动清理不再使用的资源
- 支持图片、视频、音频等多种资源类型

**主要方法**:
```typescript
// 添加资源（自动去重）
addResource(data: string, type: 'image'|'video'|'audio', mimeType: string): Promise<string>

// 获取资源数据
getResource(resourceId: string): Promise<string | null>

// 管理引用关系
addReference(resourceId: string, elementId: string, slideIndex: number): Promise<void>
removeReference(resourceId: string, elementId: string): Promise<void>

// 清理未使用的资源
cleanupUnusedResources(): Promise<void>
```

### 2. 优化的存储管理器 (AdvancedStorageManager)

**位置**: `app/ppt-edit/store/storage-manager.ts`

**改进**:
- 保存前自动提取和存储资源，将状态中的 base64 数据替换为资源引用
- 加载后自动恢复资源引用为实际数据
- 保存完成后自动清理未使用的资源

**流程**:
```
保存流程：
PPTState (with base64) → 提取资源 → PPTState (with resource IDs) → 压缩存储

加载流程：
压缩数据 → 解压 → PPTState (with resource IDs) → 恢复资源 → PPTState (with base64)
```

### 3. PPT Store 增强

**位置**: `app/ppt-edit/store/ppt-store.ts`

**新增功能**:
- 异步的元素操作方法（`addElement`, `updateElement`, `deleteElement` 等）
- 自动的资源生命周期管理
- 便捷的资源操作API

**新增方法**:
```typescript
// 从文件添加图片
addImageFromFile(file: File, elementProperties?: Partial<PPTElement>): Promise<void>

// 从URL添加图片
addImageFromUrl(url: string, elementProperties?: Partial<PPTElement>): Promise<void>

// 替换元素图片
replaceElementImage(elementId: string, newImageSrc: string): Promise<void>

// 获取资源存储统计
getResourceStorageStats(): Promise<any>
```

## 使用示例

### 基本用法

```typescript
import { usePPTStore } from './store/ppt-store';

const store = usePPTStore();

// 添加图片（自动处理资源存储）
const file = // ... File 对象
await store.addImageFromFile(file, {
  x: 100,
  y: 100,
  width: 300,
  height: 200
});

// 替换图片
await store.replaceElementImage('element-id', newBase64Data);

// 查看资源使用情况
const stats = await store.getResourceStorageStats();
console.log(`总资源数: ${stats.totalResources}`);
console.log(`存储大小: ${(stats.totalSize / 1024).toFixed(2)}KB`);
console.log(`未使用资源: ${stats.unusedResources}`);
```

### 资源生命周期

1. **添加资源**: 当添加包含图片/视频/音频的元素时，资源自动存储到独立存储中
2. **更新资源**: 当更改元素的图片源时，旧资源引用自动移除，新资源自动添加
3. **删除资源**: 当删除元素或幻灯片时，相关资源引用自动移除
4. **清理资源**: 系统定期清理引用计数为0的资源

## 性能优化

### 存储空间优化
- **去重存储**: 相同内容的图片只存储一份
- **引用机制**: 状态数据中只存储轻量级的资源ID
- **分离存储**: 资源和状态数据分开存储，互不影响

### 内存优化
- **懒加载**: 资源数据只在需要时加载到内存
- **缓存机制**: 常用资源保持在内存缓存中
- **自动清理**: 定期清理内存和存储中的无用资源

### 示例优化效果

假设一个 PPT 包含 10 个幻灯片，每个幻灯片有 3 张相同的 1MB 图片：

**优化前**:
- 每次保存: 10 × 3 × 1MB = 30MB
- 存储数据: 30MB （全部重复）

**优化后**:
- 资源存储: 1MB （去重后只存储一份）
- 状态数据: ~100KB （只包含引用ID）
- 总存储: ~1.1MB

**优化比例**: 96% 存储空间节省！

## 兼容性说明

- 完全向后兼容现有代码
- 现有的图片数据会在下次保存时自动转换为资源引用
- 服务端渲染环境自动降级为原始逻辑

## 注意事项

1. **异步操作**: 新的元素操作方法是异步的，需要使用 `await`
2. **错误处理**: 资源操作失败时会回退到原始数据，确保数据不丢失
3. **定期清理**: 系统会在保存完成5秒后自动清理无用资源
4. **存储配额**: IndexedDB 有存储配额限制，大型资源可能不会被优化存储

## 监控和调试

使用以下方法监控资源使用情况：

```typescript
// 获取详细的存储统计
const stats = await store.getResourceStorageStats();

// 手动清理资源（一般不需要）
const resourceManager = await import('./resource-manager');
await resourceManager.resourceManager.cleanupUnusedResources();
```

这套优化方案彻底解决了原始的存储空间问题，同时保持了良好的性能和用户体验。
