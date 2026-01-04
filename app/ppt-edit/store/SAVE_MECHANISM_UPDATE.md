# 保存机制更新说明

## 变更概述

根据用户需求，我们已经禁用了所有自动触发的镜像保存机制，现在只支持：

1. **手动保存**（保存按钮和 Ctrl+S 快捷键）
2. **定时保存**（每60秒自动保存一次）

## 具体变更

### 1. 禁用的自动保存触发器

✅ **已禁用**:
- 状态变更时的防抖保存
- 页面隐藏时的自动保存
- 元素操作后的自动保存

✅ **保留**:
- 每60秒的定时保存
- 页面卸载时的保存（防止数据丢失）
- 手动保存功能

### 2. 更新的配置

```typescript
const AUTO_SAVE_CONFIG = {
  enabled: true,
  interval: 60000, // 60秒定时保存
  throttleDelay: 0, // 禁用防抖保存
  maxRetries: 3,
  enableDebouncedSave: false, // 禁用状态变更时的自动保存
};
```

### 3. 新增的手动保存方法

```typescript
// 手动保存当前状态
await store.saveCurrentState();

// 启用/禁用定时保存
store.enableAutoSave();   // 启用60秒定时保存
store.disableAutoSave();  // 完全禁用自动保存
```

## 用户使用方式

### 手动保存

1. **保存按钮**: 点击界面上的保存按钮
2. **快捷键**: 按 `Ctrl+S` (Windows/Linux) 或 `Cmd+S` (Mac)

### 自动保存

- **定时保存**: 系统每60秒自动保存一次
- **页面关闭保存**: 关闭页面时自动保存，防止数据丢失

## 开发者使用方式

### 触发手动保存

```typescript
import { usePPTStore } from './store/ppt-store';

const store = usePPTStore();

// 手动保存
const handleSave = async () => {
  try {
    await store.saveCurrentState();
    console.log('保存成功');
  } catch (error) {
    console.error('保存失败:', error);
  }
};
```

### 控制自动保存

```typescript
// 禁用自动保存（包括定时保存）
store.disableAutoSave();

// 重新启用定时保存
store.enableAutoSave();
```

### 监听保存状态

保存操作会在控制台输出相应日志：

```
🔄 手动保存触发
✅ 状态保存成功
⏰ 定时保存触发
✅ 定时保存已启用 (60秒间隔)
❌ 定时保存已禁用
```

## 技术实现细节

### 1. 防抖保存机制

```typescript
function debouncedSave(state: PPTState): void {
  // 检查是否启用防抖保存
  if (!AUTO_SAVE_CONFIG.enableDebouncedSave) {
    return; // 直接返回，不执行保存
  }
  // ... 其他逻辑
}
```

### 2. 状态订阅禁用

```typescript
// 原有的状态订阅机制已被注释掉
// 不再监听状态变更自动触发保存
/*
usePPTStore.subscribe(
  (state) => state,
  (state) => {
    if (state.slides.length > 0 && !isSaving) {
      debouncedSave(state);
    }
  }
);
*/
```

### 3. 快捷键支持

```typescript
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    const state = usePPTStore.getState();
    state.saveCurrentState().catch(error => {
      console.error('快捷键保存失败:', error);
    });
  }
});
```

## 性能影响

### 优势

1. **减少不必要的存储操作**: 避免频繁的自动保存
2. **提升用户体验**: 用户完全控制保存时机
3. **降低系统负载**: 减少IndexedDB写入操作

### 注意事项

1. **数据安全**: 依赖用户主动保存，建议定期提醒保存
2. **定时保存**: 60秒间隔保证基本的数据安全
3. **页面关闭保护**: 页面卸载时仍会自动保存

## 回滚方案

如需恢复原有的自动保存机制，只需：

```typescript
// 启用防抖保存
AUTO_SAVE_CONFIG.enableDebouncedSave = true;
AUTO_SAVE_CONFIG.throttleDelay = 1000;

// 取消注释状态订阅代码
// 恢复 usePPTStore.subscribe(...)
```

这种设计确保了用户对保存操作的完全控制，同时保持了基本的数据安全保障。
