# PPT KING 产品设计需求说明书

## 1. 项目概述

### 1.1 项目背景
PPT KING 是基于 Next.js (React) 框架的在线演示文稿制作平台。该项目是一个功能完整的在线PPT编辑器，支持多种元素类型、动画效果、导出功能等，具备专业级演示文稿制作能力。

### 1.2 项目目标
- 保持所有原有功能和用户体验
- 优化性能和架构设计
- 提供更好的跨平台兼容性

### 1.3 技术栈
- **前端框架**: Next.js 15 (React 19)
- **状态管理**: Zustand/Redux Toolkit
- **构建工具**: Next.js 内置构建系统
- **样式方案**: CSS Modules/Tailwind CSS
- **类型系统**: TypeScript (保持不变)

## 2. 系统架构设计

### 2.1 整体架构
```
┌─────────────────────────────────────────────────────────────┐
│                        PPT KING                            │
├─────────────────────────────────────────────────────────────┤
│  Presentation Layer (展示层)                                │
│  ├── Editor (编辑器)                                       │
│  ├── Screen (放映模式)                                     │
│  └── Mobile (移动端)                                       │
├─────────────────────────────────────────────────────────────┤
│  Business Logic Layer (业务逻辑层)                          │
│  ├── Hooks (业务逻辑钩子)                                  │
│  ├── Services (服务层)                                     │
│  └── Utils (工具函数)                                      │
├─────────────────────────────────────────────────────────────┤
│  State Management Layer (状态管理层)                        │
│  ├── Store (状态存储)                                      │
│  └── Context (React Context)                               │
├─────────────────────────────────────────────────────────────┤
│  Data Layer (数据层)                                       │
│  ├── IndexedDB (本地存储)                                  │
│  ├── LocalStorage (配置存储)                               │
│  └── API (远程数据)                                        │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 页面结构关系（Next.js React版本）
```
App (根组件) - 路由分发和全局状态管理
├── Editor (编辑器模式) - 主要工作界面
│   ├── EditorHeader (编辑器头部) - 全局操作和导航
│   │   ├── 主菜单 (文件操作、AI功能、导入导出)
│   │   ├── 标题编辑
│   │   ├── 放映控制
│   │   ├── 主题切换按钮
│   │   └── GitHub链接
│   ├── Thumbnails (左侧缩略图) - 页面管理和导航
│   │   ├── 添加幻灯片按钮
│   │   ├── 模板选择
│   │   ├── 页面缩略图列表
│   │   ├── 分区管理
│   │   └── 页面计数器
│   ├── Canvas (中央画布区域) - 核心编辑区域
│   │   ├── CanvasTool (画布工具栏) - 画布操作工具
│   │   ├── Viewport (视口) - 画布显示区域
│   │   │   ├── 网格线
│   │   │   ├── 标尺
│   │   │   └── 对齐线
│   │   ├── EditableElement (可编辑元素) - 元素渲染
│   │   │   ├── TextElement (文本元素)
│   │   │   ├── ImageElement (图片元素)
│   │   │   ├── ShapeElement (形状元素)
│   │   │   ├── LineElement (线条元素)
│   │   │   ├── ChartElement (图表元素)
│   │   │   ├── TableElement (表格元素)
│   │   │   ├── LatexElement (LaTeX元素)
│   │   │   ├── VideoElement (视频元素)
│   │   │   └── AudioElement (音频元素)
│   │   ├── Operate (操作层) - 元素操作控制
│   │   │   ├── CommonElementOperate (通用操作)
│   │   │   ├── ImageElementOperate (图片操作)
│   │   │   ├── LineElementOperate (线条操作)
│   │   │   ├── TableElementOperate (表格操作)
│   │   │   └── LinkHandler (链接处理)
│   │   ├── MouseSelection (鼠标选择) - 框选功能
│   │   ├── ElementCreateSelection (元素创建选择)
│   │   └── ShapeCreateCanvas (形状创建画布)
│   ├── Toolbar (右侧工具栏) - 属性编辑面板
│   │   ├── ElementStylePanel (元素样式面板)
│   │   ├── ElementPositionPanel (元素位置面板)
│   │   ├── ElementAnimationPanel (元素动画面板)
│   │   ├── SlideDesignPanel (页面设计面板)
│   │   ├── SlideAnimationPanel (页面动画面板)
│   │   ├── MultiPositionPanel (多选位置面板)
│   │   └── MultiStylePanel (多选样式面板)
│   └── Remark (备注区域) - 演讲者备注编辑
├── Screen (放映模式) - 演示播放界面
│   ├── BaseView (基础放映视图) - 全屏演示
│   │   ├── ScreenSlide (幻灯片显示)
│   │   ├── ScreenElement (元素渲染)
│   │   ├── WritingBoardTool (手写板工具)
│   │   ├── CountdownTimer (倒计时器)
│   │   └── BottomThumbnails (底部缩略图)
│   └── PresenterView (演讲者视图) - 演讲者专用
│       ├── PresenterView (演讲者控制)
│       ├── ScreenSlide (观众端显示)
│       └── NotesPanel (备注面板)
└── Mobile (移动端) - 移动设备适配
    ├── MobileEditor (移动端编辑器) - 简化版编辑器
    ├── MobilePlayer (移动端播放器) - 移动端放映
    └── MobilePreview (移动端预览) - 移动端预览
```

### 2.3 组件关联关系分析

#### 2.3.1 数据流向关系
```
┌─────────────────────────────────────────────────────────────┐
│                    数据流向关系图                            │
├─────────────────────────────────────────────────────────────┤
│  Store (状态管理)                                           │
│  ├── MainStore (主状态) ←→ EditorHeader, Canvas, Toolbar   │
│  ├── SlidesStore (幻灯片) ←→ Thumbnails, Canvas, Screen    │
│  ├── SnapshotStore (快照) ←→ 全局操作                      │
│  ├── KeyboardStore (键盘) ←→ 全局快捷键                    │
│  └── ScreenStore (放映) ←→ Screen, EditorHeader            │
├─────────────────────────────────────────────────────────────┤
│  Hooks (业务逻辑)                                           │
│  ├── useGlobalHotkey ←→ 全局快捷键处理                     │
│  ├── useScreening ←→ 放映模式切换                          │
│  ├── useSlideHandler ←→ 页面管理操作                       │
│  ├── useCreateElement ←→ 元素创建                          │
│  ├── useSelectElement ←→ 元素选择                          │
│  ├── useMoveElement ←→ 元素移动                            │
│  ├── useScaleElement ←→ 元素缩放                           │
│  ├── useDeleteElement ←→ 元素删除                          │
│  ├── useCopyAndPasteElement ←→ 复制粘贴                    │
│  ├── useHistorySnapshot ←→ 历史记录                        │
│  ├── useExport ←→ 导出功能                                 │
│  ├── useImport ←→ 导入功能                                 │
│  └── useAIPPT ←→ AI功能                                    │
├─────────────────────────────────────────────────────────────┤
│  Components (组件交互)                                      │
│  ├── Canvas ←→ EditableElement ←→ Operate                  │
│  ├── Toolbar ←→ Canvas (双向数据绑定)                      │
│  ├── Thumbnails ←→ Canvas (页面切换)                       │
│  ├── EditorHeader ←→ 全局功能                              │
│  └── Modal ←→ 各种弹窗功能                                 │
└─────────────────────────────────────────────────────────────┘
```

#### 2.3.2 组件依赖关系
```
┌─────────────────────────────────────────────────────────────┐
│                    组件依赖关系图                            │
├─────────────────────────────────────────────────────────────┤
│  核心依赖层                                                 │
│  ├── App.tsx (根组件)                                      │
│  │   ├── 依赖: store, hooks, utils                        │
│  │   └── 提供: 全局状态、路由分发                          │
│  │                                                         │
│  ├── Editor (编辑器)                                       │
│  │   ├── 依赖: EditorHeader, Canvas, Thumbnails, Toolbar  │
│  │   ├── 依赖: Modal, 各种Panel                           │
│  │   └── 提供: 编辑器整体布局                              │
│  │                                                         │
│  ├── Canvas (画布)                                         │
│  │   ├── 依赖: EditableElement, Operate, CanvasTool       │
│  │   ├── 依赖: MouseSelection, Ruler                      │
│  │   └── 提供: 画布渲染和交互                              │
│  │                                                         │
│  └── Screen (放映)                                         │
│      ├── 依赖: BaseView, PresenterView                     │
│      └── 提供: 放映功能                                    │
├─────────────────────────────────────────────────────────────┤
│  功能组件层                                                 │
│  ├── EditableElement (可编辑元素)                          │
│  │   ├── 依赖: 各种具体元素组件                            │
│  │   └── 提供: 元素渲染和编辑                              │
│  │                                                         │
│  ├── Operate (操作控制)                                    │
│  │   ├── 依赖: 各种操作组件                                │
│  │   └── 提供: 元素操作界面                                │
│  │                                                         │
│  ├── Toolbar (工具栏)                                      │
│  │   ├── 依赖: 各种面板组件                                │
│  │   └── 提供: 属性编辑界面                                │
│  │                                                         │
│  └── Thumbnails (缩略图)                                   │
│      ├── 依赖: ThumbnailSlide, Templates                  │
│      └── 提供: 页面管理界面                                │
├─────────────────────────────────────────────────────────────┤
│  基础组件层                                                 │
│  ├── Button, Input, Modal, Tabs 等                        │
│  ├── 依赖: 样式变量、工具函数                              │
│  └── 提供: 基础UI组件                                      │
└─────────────────────────────────────────────────────────────┘
```

### 2.4 组件通信机制

#### 2.4.1 父子组件通信
```
┌─────────────────────────────────────────────────────────────┐
│                    父子组件通信机制                          │
├─────────────────────────────────────────────────────────────┤
│  Props 向下传递                                            │
│  ├── Editor → Canvas: 画布配置                             │
│  ├── Canvas → EditableElement: 元素信息                    │
│  ├── Canvas → Operate: 操作参数                            │
│  └── Toolbar → 各种Panel: 面板配置                         │
├─────────────────────────────────────────────────────────────┤
│  Events 向上传递                                           │
│  ├── EditableElement → Canvas: 元素选择事件                │
│  ├── Operate → Canvas: 操作完成事件                        │
│  ├── Thumbnails → Editor: 页面切换事件                     │
│  └── CanvasTool → Canvas: 工具操作事件                     │
├─────────────────────────────────────────────────────────────┤
│  React状态管理                                              │
│  ├── useState: 组件内部状态管理                            │
│  ├── useContext: 跨组件状态共享                            │
│  └── useReducer: 复杂状态逻辑管理                          │
└─────────────────────────────────────────────────────────────┘
```

#### 2.4.2 跨组件通信
```
┌─────────────────────────────────────────────────────────────┐
│                    跨组件通信机制                            │
├─────────────────────────────────────────────────────────────┤
│  Store 状态共享                                            │
│  ├── 元素选择: MainStore.activeElementIdList               │
│  ├── 画布状态: MainStore.canvasScale                       │
│  ├── 工具栏状态: MainStore.toolbarState                    │
│  └── 幻灯片数据: SlidesStore.slides                        │
├─────────────────────────────────────────────────────────────┤
│  Hooks 逻辑复用                                            │
│  ├── useGlobalHotkey: 全局快捷键                           │
│  ├── useScreening: 放映模式切换                            │
│  ├── useSlideHandler: 页面管理                             │
│  └── useElementOperations: 元素操作                        │
├─────────────────────────────────────────────────────────────┤
│  React Context 上下文                                      │
│  ├── ThemeContext: 主题上下文                              │
│  ├── EditorContext: 编辑器上下文                            │
│  └── ScreenContext: 放映上下文                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.5 数据流架构

#### 2.5.1 单向数据流
```
┌─────────────────────────────────────────────────────────────┐
│                    单向数据流架构                            │
├─────────────────────────────────────────────────────────────┤
│  数据流向: Store → Component → User Action → Store         │
│  │                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │   Store     │───▶│ Component   │───▶│ User Action │    │
│  │  (状态)     │    │  (组件)     │    │  (用户操作) │    │
│  └─────────────┘    └─────────────┘    └─────────────┘    │
│         ▲                   │                   │          │
│         │                   │                   │          │
│         └───────────────────┼───────────────────┘          │
│                             │                              │
│                             ▼                              │
│                    ┌─────────────┐                         │
│                    │   Store     │                         │
│                    │  (状态更新) │                         │
│                    └─────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

#### 2.5.2 具体数据流示例
```
┌─────────────────────────────────────────────────────────────┐
│                    元素选择数据流示例                        │
├─────────────────────────────────────────────────────────────┤
│  1. 用户点击元素                                           │
│     ↓                                                      │
│  2. EditableElement 触发点击事件                           │
│     ↓                                                      │
│  3. Canvas 接收事件并调用 useSelectElement                 │
│     ↓                                                      │
│  4. useSelectElement 调用 MainStore.setActiveElementIdList │
│     ↓                                                      │
│  5. MainStore 更新 activeElementIdList                     │
│     ↓                                                      │
│  6. 所有订阅该状态的组件自动更新                           │
│     ├── Canvas: 显示选中状态                               │
│     ├── Operate: 显示操作控件                               │
│     ├── Toolbar: 切换到对应面板                             │
│     └── Thumbnails: 更新选中状态                           │
└─────────────────────────────────────────────────────────────┘
```

### 2.6 组件生命周期管理

#### 2.6.1 组件挂载顺序
```
┌─────────────────────────────────────────────────────────────┐
│                    组件挂载顺序                              │
├─────────────────────────────────────────────────────────────┤
│  1. App.tsx (根组件)                                       │
│     ├── 初始化 Store                                       │
│     ├── 加载初始数据                                       │
│     └── 根据设备类型选择模式                               │
│  │                                                         │
│  2. Editor (编辑器模式)                                    │
│     ├── EditorHeader (头部)                                │
│     ├── Thumbnails (左侧)                                  │
│     ├── Canvas (中央)                                      │
│     │   ├── CanvasTool (工具栏)                            │
│     │   ├── Viewport (视口)                                │
│     │   └── EditableElement (元素)                         │
│     ├── Toolbar (右侧)                                     │
│     └── Remark (底部)                                      │
│  │                                                         │
│  3. 功能组件                                               │
│     ├── Modal (弹窗)                                       │
│     ├── Panel (面板)                                       │
│     └── 其他功能组件                                       │
└─────────────────────────────────────────────────────────────┘
```

#### 2.6.2 组件卸载顺序
```
┌─────────────────────────────────────────────────────────────┐
│                    组件卸载顺序                              │
├─────────────────────────────────────────────────────────────┤
│  1. 功能组件                                               │
│     ├── Panel (面板)                                       │
│     ├── Modal (弹窗)                                       │
│     └── 其他功能组件                                       │
│  │                                                         │
│  2. 编辑器组件 (从内到外)                                   │
│     ├── EditableElement (元素)                             │
│     ├── Canvas (画布)                                      │
│     ├── Toolbar (工具栏)                                   │
│     ├── Thumbnails (缩略图)                                │
│     └── EditorHeader (头部)                                │
│  │                                                         │
│  3. Editor (编辑器)                                        │
│  │                                                         │
│  4. App.tsx (根组件)                                       │
│     ├── 清理事件监听                                       │
│     ├── 保存数据                                           │
│     └── 清理数据库连接                                     │
└─────────────────────────────────────────────────────────────┘
```

### 2.7 性能优化策略

#### 2.7.1 组件级优化
```
┌─────────────────────────────────────────────────────────────┐
│                    组件级性能优化                            │
├─────────────────────────────────────────────────────────────┤
│  1. 组件懒加载                                             │
│     ├── 动态导入: const Component = lazy(() => import('./Component'))
│     ├── 路由懒加载: 按需加载页面组件                        │
│     └── 功能懒加载: 按需加载功能模块                        │
│  │                                                         │
│  2. 组件缓存                                               │
│     ├── React.memo: 组件记忆化                             │
│     ├── useMemo: 值记忆化                                  │
│     ├── useCallback: 函数记忆化                            │
│     └── 虚拟滚动: 大量列表项优化                           │
│  │                                                         │
│  3. 渲染优化                                               │
│     ├── 条件渲染: 使用条件语句优化                          │
│     ├── 列表渲染: 使用key优化                               │
│     └── 防抖节流: 频繁操作优化                             │
└─────────────────────────────────────────────────────────────┘
```

#### 2.7.2 数据级优化
```
┌─────────────────────────────────────────────────────────────┐
│                    数据级性能优化                            │
├─────────────────────────────────────────────────────────────┤
│  1. 状态管理优化                                           │
│     ├── 状态分片: 按功能模块分割状态                        │
│     ├── 状态订阅: 只订阅需要的状态                          │
│     └── 状态缓存: 缓存计算结果                              │
│  │                                                         │
│  2. 数据更新优化                                           │
│     ├── 增量更新: 只更新变化的数据                          │
│     ├── 批量更新: 合并多个更新操作                          │
│     └── 异步更新: 非关键数据异步处理                        │
│  │                                                         │
│  3. 内存管理优化                                           │
│     ├── 对象池: 复用频繁创建的对象                          │
│     ├── 事件清理: 及时清理事件监听                          │
│     └── 图片压缩: 优化图片资源占用                          │
└─────────────────────────────────────────────────────────────┘
```

### 2.8 错误处理和边界

#### 2.8.1 错误边界策略
```
┌─────────────────────────────────────────────────────────────┐
│                    错误边界策略                              │
├─────────────────────────────────────────────────────────────┤
│  1. 组件级错误处理                                         │
│     ├── Error Boundary: React错误边界组件                   │
│     ├── try-catch: 捕获组件内部错误                        │
│     └── fallback UI: 降级UI显示                            │
│  │                                                         │
│  2. 全局错误处理                                           │
│     ├── 全局错误监听: window.onerror                       │
│     ├── Promise错误: unhandledrejection                    │
│     └── 异步错误: async/await错误处理                      │
│  │                                                         │
│  3. 错误恢复策略                                           │
│     ├── 自动重试: 网络请求失败重试                          │
│     ├── 状态回滚: 操作失败回滚状态                          │
│     └── 用户提示: 友好的错误提示信息                        │
└─────────────────────────────────────────────────────────────┘
```

## 3. 核心功能模块

### 3.1 编辑器核心功能

#### 3.1.1 画布管理
- **画布缩放**: 支持 25% - 400% 缩放，快捷键 Ctrl+/- 控制
- **画布拖拽**: 空格键拖拽画布，鼠标滚轮缩放
- **网格线**: 可配置网格线尺寸，辅助对齐
- **标尺**: 显示水平和垂直标尺，辅助定位
- **对齐线**: 元素对齐时显示智能对齐线
- **画布大小**: 可自定义画布尺寸

#### 3.1.2 元素操作
- **选择**: 单选、多选、组合选择、框选、点选
- **移动**: 拖拽移动、方向键微调
- **缩放**: 等比例缩放、自由缩放
- **旋转**: 自由旋转、角度微调
- **对齐**: 左对齐、居中对齐、右对齐、顶部对齐、底部对齐
- **分布**: 水平分布、垂直分布
- **组合**: 元素组合、取消组合
- **锁定**: 元素锁定、解锁
- **隐藏**: 元素隐藏、显示
- **复制粘贴**: 元素复制、粘贴
- **磁性对齐**: 移动和缩放时的智能对齐
- **图层调整**: 元素图层顺序调整
- **元素命名**: 为元素设置名称

#### 3.1.3 历史记录
- **撤销/重做**: 支持无限级撤销重做
- **快照管理**: 自动保存快照到 IndexedDB
- **操作记录**: 记录所有用户操作
- **快捷键支持**: 完整的快捷键操作支持
- **右键菜单**: 丰富的右键上下文菜单

### 3.2 元素类型系统

#### 3.2.1 文本元素 (TextElement)
- **文本类型**: 标题、副标题、内容、项目、项目标题、备注、页眉、页脚
- **样式属性**: 字体、字号、颜色、高亮、加粗、斜体、下划线、删除线、下标、内联代码、引用、超链接
- **段落属性**: 行高、字间距、段间距、对齐方式、缩进、首行缩进、编号、项目符号、清除格式
- **特效**: 阴影、透明度、文本方向（横向/竖向）、填充颜色、边框
- **富文本编辑**: 基于 ProseMirror 的富文本编辑器
- **AI 功能**: 支持 AI 重写/扩展/缩写文本内容

#### 3.2.2 图片元素 (ImageElement)
- **图片格式**: 支持 JPG、PNG、GIF、WebP 等格式
- **图片处理**: 裁剪、滤镜、翻转、圆角、阴影
- **滤镜效果**: 模糊、亮度、对比度、灰度、饱和度、色相旋转、透明度
- **裁剪功能**: 自定义裁剪、形状裁剪、宽高比裁剪
- **颜色蒙版**: 支持颜色蒙版效果（色调）
- **其他功能**: 替换图片、重置图片、设置为背景

#### 3.2.3 形状元素 (ShapeElement)
- **基础形状**: 矩形、圆形、三角形、菱形、五角星等
- **自定义形状**: 支持自由绘制任意多边形
- **形状属性**: 填充色、渐变、图片填充、边框、阴影、透明度
- **文本形状**: 形状内可添加文本内容（支持富文本编辑）
- **路径公式**: 支持复杂形状的路径计算公式
- **其他功能**: 替换形状、形状格式刷

#### 3.2.4 线条元素 (LineElement)
- **线条类型**: 直线、折线、曲线、三次曲线
- **线条样式**: 实线、虚线、点线
- **端点样式**: 无、箭头、圆点
- **线条属性**: 颜色、宽度、阴影
- **特殊功能**: 绘制任意线条（未闭合形状模拟）

#### 3.2.5 图表元素 (ChartElement)
- **图表类型**: 柱状图、折线图、饼图、环形图、面积图、散点图、雷达图
- **数据管理**: 支持多系列数据、图例、标签
- **主题配置**: 主题色、文字颜色、网格颜色
- **图表选项**: 平滑曲线、堆叠显示等
- **其他功能**: 图表类型转换、数据编辑、背景填充、坐标系统和轴文本颜色、网格颜色、其他图表设置、边框

#### 3.2.6 表格元素 (TableElement)
- **表格结构**: 支持行列合并、动态行列、添加/删除行和列
- **单元格样式**: 字体、颜色、背景色、对齐方式、加粗、斜体、下划线、删除线
- **表格主题**: 主题色、标题行、汇总行、第一列、最后一列样式
- **表格编辑**: 实时编辑、样式应用、边框设置

#### 3.2.7 LaTeX元素 (LatexElement)
- **公式编辑**: 支持 LaTeX 数学公式
- **公式渲染**: 转换为 SVG 路径显示
- **公式属性**: 颜色、线条宽度、固定比例

#### 3.2.8 媒体元素
- **视频元素**: 支持多种视频格式，自动播放、预览封面设置
- **音频元素**: 支持多种音频格式，图标颜色、自动播放、循环播放

### 3.3 动画系统

#### 3.3.1 动画类型
- **入场动画**: 淡入、滑入、缩放、旋转等
- **退场动画**: 淡出、滑出、缩放、旋转等
- **强调动画**: 脉冲、摇摆、弹跳等

#### 3.3.2 动画触发
- **点击触发**: 单击时播放动画
- **同时触发**: 与上一动画同时播放
- **自动触发**: 上一动画结束后自动播放

#### 3.3.3 动画属性
- **持续时间**: 可配置动画时长
- **延迟时间**: 可设置动画延迟
- **缓动函数**: 支持多种缓动效果

### 3.4 页面管理

#### 3.4.1 页面操作
- **新增页面**: 空白页、模板页、复制页
- **删除页面**: 单页删除、批量删除
- **页面排序**: 拖拽排序、剪切粘贴
- **页面类型**: 封面页、目录页、过渡页、内容页、结束页
- **页面管理**: 复制/粘贴页面、调整页面顺序、创建分区

#### 3.4.2 页面背景
- **背景类型**: 纯色、图片、渐变
- **背景图片**: 覆盖、包含、重复
- **渐变背景**: 线性渐变、径向渐变

#### 3.4.3 页面切换
- **切换方式**: 无、淡入淡出、滑动、3D旋转、缩放等
- **切换时间**: 可配置切换动画时长
- **切换动画**: 支持多种页面切换动画效果

### 3.5 主题系统

#### 3.5.1 主题配置
- **主题色**: 6种主题色配置
- **字体设置**: 默认字体、字体颜色
- **背景色**: 页面背景颜色
- **阴影效果**: 默认阴影样式
- **边框样式**: 默认边框样式
- **画布设置**: 设置画布大小

#### 3.5.2 模板系统
- **内置模板**: 红色通用、蓝色通用、紫色通用、莫兰迪配色
- **模板应用**: 一键应用模板样式
- **主题提取**: 从现有页面提取主题样式
- **标签系统**: 页面和节点类型标签（可用于模板相关功能）

### 3.6 放映系统

#### 3.6.1 放映模式
- **全屏放映**: 全屏演示模式
- **演讲者视图**: 演讲者专用视图
- **移动端放映**: 移动设备放映支持
- **预览模式**: 预览所有幻灯片

#### 3.6.2 放映工具
- **手写板**: 支持手写批注
- **画笔工具**: 钢笔/形状/箭头/荧光笔批注、橡皮擦、黑板模式
- **倒计时**: 放映倒计时功能
- **快捷键**: 放映控制快捷键
- **激光笔**: 激光笔功能
- **自动播放**: 自动放映功能
- **底部导航**: 底部缩略图导航

### 3.7 移动端系统

#### 3.7.1 基础编辑
- **页面管理**: 添加/删除/复制/备注/撤销重做页面
- **元素插入**: 插入文本、图片、矩形、圆形
- **元素操作**: 移动、缩放、旋转、复制、删除、图层调整、对齐

#### 3.7.2 样式设置
- **文本样式**: 加粗、斜体、下划线、删除线、字体大小、颜色、对齐
- **填充样式**: 填充颜色设置

#### 3.7.3 预览功能
- **基础预览**: 基础预览模式
- **播放预览**: 播放预览模式

## 4. 技术实现细节

### 4.1 核心第三方库

#### 4.1.1 富文本编辑
- **ProseMirror**: 核心富文本编辑器框架
  - `prosemirror-model`: 文档模型
  - `prosemirror-state`: 编辑器状态管理
  - `prosemirror-view`: 编辑器视图
  - `prosemirror-commands`: 编辑器命令
  - `prosemirror-history`: 历史记录管理
  - `prosemirror-inputrules`: 输入规则
  - `prosemirror-keymap`: 快捷键映射
  - `prosemirror-schema-basic`: 基础节点模式
  - `prosemirror-schema-list`: 列表节点模式
  - `prosemirror-dropcursor`: 拖拽光标
  - `prosemirror-gapcursor`: 间隙光标

#### 4.1.2 图表渲染
- **ECharts**: 图表渲染引擎
  - 支持多种图表类型
  - 主题配置和样式定制
  - 数据驱动更新

#### 4.1.3 数学公式
- **hfmath**: LaTeX 公式渲染
  - 数学公式解析
  - SVG 路径生成

#### 4.1.4 导出功能
- **pptxgenjs**: PPTX 文件生成
  - 支持所有元素类型
  - 样式和动画保持
- **pptxtojson**: PPTX 文件解析和转换 (GitHub源码)
  - 将 PPTX 文件转换为 JSON 格式
  - 支持导入现有 PPT 文件
- **html-to-image**: 图片导出
  - PNG、JPEG 格式支持
  - 高质量图片生成
- **file-saver**: 文件下载
  - 浏览器文件保存
  - 支持多种文件格式

#### 4.1.5 数据处理
- **Dexie**: IndexedDB 封装库
  - 本地数据存储
  - 快照管理
  - 数据库版本管理
- **crypto-js**: 加密解密
  - 文件加密存储
  - 数据安全保护
- **axios**: HTTP 客户端
  - API 请求处理
  - 数据获取和提交

#### 4.1.6 UI 组件和交互
- **@icon-park/react**: React图标库
  - 丰富的图标资源
  - 统一的图标风格
- **framer-motion**: React动画库
  - 预设动画效果
  - 页面和元素动画
- **tippy.js**: 工具提示库
  - 智能提示显示
  - 丰富的提示样式
- **@dnd-kit/core**: React拖拽库
  - 元素拖拽排序
  - 列表拖拽操作

#### 4.1.7 工具库
- **lodash**: 工具函数库
  - 数组、对象、字符串处理
  - 函数式编程工具
- **nanoid**: ID 生成器
  - 唯一标识符生成
  - 安全的随机 ID
- **tinycolor2**: 颜色处理
  - 颜色格式转换
  - 颜色操作和计算
- **svg-arc-to-cubic-bezier**: SVG 路径转换
  - 圆弧到贝塞尔曲线转换
  - SVG 路径优化
- **svg-pathdata**: SVG 路径解析
  - SVG 路径数据解析
  - 路径操作和修改
- **number-precision**: 数字精度处理
  - 避免浮点数精度问题
  - 精确的数学计算
- **mitt**: 事件发射器
  - 轻量级事件系统
  - 组件间通信

#### 4.1.8 状态管理
- **Zustand**: React 状态管理库
  - 轻量级状态管理
  - 类型安全的状态管理
  - 组合式 API 支持
  - 开发工具集成

#### 4.1.9 开发工具
- **Next.js**: React 框架
  - 内置构建系统
  - 路由管理
  - 服务端渲染支持
- **TypeScript**: 类型系统
  - 静态类型检查
  - 更好的开发体验
- **ESLint**: 代码检查
  - 代码质量保证
  - 统一的代码风格

### 4.2 第三方库


#### 4.2.1 可直接使用的库
- **ProseMirror**: 完全兼容，可直接使用
- **ECharts**: 完全兼容，可直接使用
- **hfmath**: 完全兼容，可直接使用
- **pptxgenjs**: 完全兼容，可直接使用
- **pptxtojson**: 完全兼容，可直接使用 (GitHub源码)
- **html-to-image**: 完全兼容，可直接使用
- **Dexie**: 完全兼容，可直接使用
- **crypto-js**: 完全兼容，可直接使用
- **file-saver**: 完全兼容，可直接使用
- **lodash**: 完全兼容，可直接使用
- **nanoid**: 完全兼容，可直接使用
- **tinycolor2**: 完全兼容，可直接使用
- **svg-arc-to-cubic-bezier**: 完全兼容，可直接使用
- **svg-pathdata**: 完全兼容，可直接使用
- **number-precision**: 完全兼容，可直接使用
- **mitt**: 完全兼容，可直接使用
- **axios**: 完全兼容，可直接使用

#### 4.2.2 需要替换的库
- **@icon-park/react**:  React 版本
- **@dnd-kit/core**: React 拖拽库
- **Zustand**: React 状态管理
- **Next.js 内置构建系统**: 构建工具替换

#### 4.2.3 新增推荐的库
- **Framer Motion**: React 动画库，替代 animate.css
- **React Hook Form**: 表单处理库
- **React Query**: 数据获取和缓存库
- **Zustand**: 轻量级状态管理库
- **Tailwind CSS**: 原子化 CSS 框架

#### 4.2.4 第三方库依赖关系图
```
┌─────────────────────────────────────────────────────────────┐
│                    PPT KING 核心功能                        │
├─────────────────────────────────────────────────────────────┤
│  富文本编辑  │  图表渲染  │  数学公式  │  导出功能  │  数据处理  │
│  ProseMirror │  ECharts   │  hfmath    │pptxgenjs   │   Dexie    │
│              │            │            │pptxtojson  │ crypto-js  │
│              │            │            │html-to-img │   axios    │
├─────────────────────────────────────────────────────────────┤
│  UI组件交互  │  工具库    │  状态管理  │  开发工具  │
│  Icon Park   │  lodash    │  Zustand   │  Next.js   │
│Framer Motion │  nanoid    │            │TypeScript  │
│  Tippy.js    │tinycolor2  │            │  ESLint    │
│  @dnd-kit    │svg-utils   │            │            │
│              │mitt        │            │            │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 状态管理架构

#### 4.3.1 主要状态
```typescript
interface MainState {
  // 元素选择状态
  activeElementIdList: string[]
  handleElementId: string
  activeGroupElementId: string
  hiddenElementIdList: string[]
  
  // 画布状态
  canvasPercentage: number
  canvasScale: number
  canvasDragged: boolean
  
  // 界面状态
  thumbnailsFocus: boolean
  editorAreaFocus: boolean
  disableHotkeys: boolean
  
  // 工具状态
  gridLineSize: number
  showRuler: boolean
  creatingElement: CreatingElement | null
  creatingCustomShape: boolean
  toolbarState: ToolbarStates
  
  // 格式刷状态
  textFormatPainter: TextFormatPainter | null
  shapeFormatPainter: ShapeFormatPainter | null
  
  // 面板状态
  showSelectPanel: boolean
  showSearchPanel: boolean
  showNotesPanel: boolean
  showSymbolPanel: boolean
  showMarkupPanel: boolean
  showAIPPTDialog: boolean
}
```

#### 4.3.2 幻灯片状态
```typescript
interface SlidesState {
  title: string
  theme: SlideTheme
  slides: Slide[]
  slideIndex: number
  viewportSize: number
  viewportRatio: number
  templates: SlideTemplate[]
}
```

### 4.3 数据存储结构

#### 4.3.3 IndexedDB 设计
```typescript
interface DatabaseSchema {
  snapshots: {
    id: number
    index: number
    slides: Slide[]
  }
  writingBoardImgs: {
    id: string
    dataURL: string
  }
}
```

#### 4.3.4 本地存储
- **配置数据**: 用户偏好设置
- **历史记录**: 操作历史
- **临时数据**: 草稿和缓存

## 5. 组件设计规范

### 5.1 基础组件

#### 5.1.1 按钮组件
- **Button**: 基础按钮
- **ButtonGroup**: 按钮组
- **ColorButton**: 颜色按钮
- **TextColorButton**: 文字颜色按钮
- **RadioButton**: 单选按钮
- **CheckboxButton**: 复选框按钮

#### 5.1.2 输入组件
- **Input**: 文本输入框
- **TextArea**: 多行文本输入
- **NumberInput**: 数字输入框
- **Select**: 下拉选择器
- **Slider**: 滑块组件
- **Switch**: 开关组件

#### 5.1.3 面板组件
- **Modal**: 模态对话框
- **Drawer**: 抽屉面板
- **Popover**: 弹出面板
- **Tabs**: 标签页组件
- **Divider**: 分割线组件

#### 5.1.4 特殊组件
- **ColorPicker**: 颜色选择器
- **LaTeXEditor**: LaTeX 公式编辑器
- **WritingBoard**: 手写板组件
- **FileInput**: 文件输入组件

### 5.2 业务组件

#### 5.2.1 编辑器组件
- **EditorHeader**: 编辑器头部
- **Thumbnails**: 缩略图面板
- **Canvas**: 画布组件
- **Toolbar**: 工具栏
- **CanvasTool**: 画布工具

#### 5.2.2 元素组件
- **TextElement**: 文本元素
- **ImageElement**: 图片元素
- **ShapeElement**: 形状元素
- **LineElement**: 线条元素
- **ChartElement**: 图表元素
- **TableElement**: 表格元素
- **LatexElement**: LaTeX 元素
- **VideoElement**: 视频元素
- **AudioElement**: 音频元素

#### 5.2.3 操作组件
- **ElementOperate**: 元素操作
- **MultiSelectOperate**: 多选操作
- **ImageElementOperate**: 图片操作
- **LineElementOperate**: 线条操作

### 5.3 组件关系图

```
Editor (编辑器)
├── EditorHeader (头部)
├── Thumbnails (左侧缩略图)
├── Canvas (中央画布)
│   ├── CanvasTool (工具栏)
│   ├── Viewport (视口)
│   └── Operate (操作层)
├── Toolbar (右侧工具栏)
└── Remark (备注)

Canvas (画布)
├── ElementCreateSelection (元素创建选择)
├── ShapeCreateCanvas (形状创建画布)
├── AlignmentLine (对齐线)
├── MultiSelectOperate (多选操作)
├── Operate (单元素操作)
├── ViewportBackground (视口背景)
├── MouseSelection (鼠标选择)
└── EditableElement (可编辑元素)

Toolbar (工具栏)
├── ElementStylePanel (元素样式面板)
├── ElementPositionPanel (元素位置面板)
├── ElementAnimationPanel (元素动画面板)
├── SlideDesignPanel (页面设计面板)
├── SlideAnimationPanel (页面动画面板)
├── MultiPositionPanel (多选位置面板)
└── MultiStylePanel (多选样式面板)
```

### 5.4 React组件设计原则

#### 5.4.1 组件结构
```typescript
// 函数式组件结构
interface ComponentProps {
  // 组件属性定义
}

const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // 状态管理
  const [state, setState] = useState(initialState)
  
  // 副作用处理
  useEffect(() => {
    // 副作用逻辑
    return () => {
      // 清理逻辑
    }
  }, [dependencies])
  
  // 事件处理
  const handleEvent = useCallback(() => {
    // 事件处理逻辑
  }, [dependencies])
  
  // 计算属性
  const computedValue = useMemo(() => {
    // 计算逻辑
  }, [dependencies])
  
  // 渲染
  return (
    <div className="component">
      {/* JSX内容 */}
    </div>
  )
}

export default Component
```

#### 5.4.2 状态管理
```typescript
// 使用Zustand进行状态管理
interface StoreState {
  // 状态定义
  count: number
  increment: () => void
  decrement: () => void
}

const useStore = create<StoreState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}))
```

#### 5.4.3 组件通信
```typescript
// 父子组件通信
interface ParentProps {
  onChildEvent: (data: any) => void
}

const Parent: React.FC = () => {
  const handleChildEvent = (data: any) => {
    // 处理子组件事件
  }
  
  return <Child onChildEvent={handleChildEvent} />
}

const Child: React.FC<ParentProps> = ({ onChildEvent }) => {
  const handleClick = () => {
    onChildEvent({ message: 'Hello from child' })
  }
  
  return <button onClick={handleClick}>Click me</button>
}
```

#### 5.4.4 自定义Hook
```typescript
// 自定义Hook封装业务逻辑
const useElementSelection = () => {
  const [selectedElements, setSelectedElements] = useState<string[]>([])
  
  const selectElement = useCallback((elementId: string) => {
    setSelectedElements(prev => [...prev, elementId])
  }, [])
  
  const deselectElement = useCallback((elementId: string) => {
    setSelectedElements(prev => prev.filter(id => id !== elementId))
  }, [])
  
  const clearSelection = useCallback(() => {
    setSelectedElements([])
  }, [])
  
  return {
    selectedElements,
    selectElement,
    deselectElement,
    clearSelection,
  }
}
```

## 6. 功能清单

### 6.1 基础编辑功能
- [x] 文本编辑和格式化
- [x] 图片插入和编辑
- [x] 形状绘制和编辑
- [x] 线条绘制和编辑
- [x] 图表创建和编辑
- [x] 表格创建和编辑
- [x] LaTeX 公式编辑
- [x] 音视频插入和播放
- [x] 元素选择和操作
- [x] 元素组合和锁定
- [x] 元素对齐和分布
- [x] 历史记录（撤销/重做）
- [x] 快捷键支持
- [x] 右键菜单
- [x] 拖拽添加文本和图片
- [x] 粘贴外部图片
- [x] 元素磁性对齐（移动和缩放时）
- [x] 元素图层调整
- [x] 元素相对于画布对齐
- [x] 元素相对于其他元素对齐
- [x] 多个元素均匀分布
- [x] 元素超链接（链接到网页、其他幻灯片页面）

### 6.2 高级功能
- [x] 动画效果系统
- [x] 页面切换效果
- [x] 主题和模板系统
- [x] 格式刷功能
- [x] 批注和备注系统
- [x] 查找和替换
- [x] 选择窗格
- [x] 符号插入
- [x] 类型标注
- [x] 页面分区管理
- [x] 网格线和标尺
- [x] 画布缩放和移动
- [x] 主题样式提取
- [x] 演讲者备注（富文本）
- [x] 页面和节点类型标签（可用于模板相关功能）
- [x] 批注系统
- [x] 手写板模式
- [x] 激光笔功能
- [x] 自动播放
- [x] 倒计时工具

### 6.3 导出功能
- [x] 导出为图片 (PNG/JPEG)
- [x] 导出为 PPTX 文件
- [x] 导出为 PDF 文件
- [x] 导出为 JSON 文件
- [x] 打印功能
- [x] 本地文件导出

### 6.4 放映功能
- [x] 全屏放映模式
- [x] 演讲者视图
- [x] 倒计时器
- [x] 手写板功能
- [x] 快捷键控制
- [x] 画笔工具（钢笔/形状/箭头/荧光笔批注、橡皮擦、黑板模式）
- [x] 预览所有幻灯片
- [x] 底部缩略图导航
- [x] 激光笔功能
- [x] 自动播放

### 6.5 移动端功能
- [x] 移动端编辑器
- [x] 移动端播放器
- [x] 移动端预览
- [x] 触摸操作支持
- [x] 基础编辑功能（添加/删除/复制/备注/撤销重做页面）
- [x] 插入文本、图片、矩形、圆形
- [x] 通用元素操作：移动、缩放、旋转、复制、删除、图层调整、对齐
- [x] 元素样式：文本（加粗、斜体、下划线、删除线、字体大小、颜色、对齐）、填充颜色

### 6.6 AI 功能
- [x] AI PPT 生成
- [x] 智能内容建议
- [x] 自动布局优化
- [x] AI 文本重写/扩展/缩写

## 7. 性能优化策略

### 7.1 渲染优化
- **虚拟滚动**: 大量元素时的性能优化
- **懒加载**: 图片和媒体资源的懒加载
- **防抖节流**: 频繁操作的事件优化
- **Canvas 优化**: 使用 Canvas 进行复杂渲染

### 7.2 内存管理
- **对象池**: 频繁创建销毁的对象复用
- **事件清理**: 组件销毁时清理事件监听
- **图片压缩**: 大图片的压缩和优化

### 7.3 数据优化
- **增量更新**: 只更新变化的数据
- **缓存策略**: 常用数据的缓存
- **分页加载**: 大量数据的分页处理

## 8. 兼容性要求

### 8.1 浏览器支持
- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

### 8.2 设备支持
- **桌面端**: Windows、macOS、Linux
- **移动端**: iOS 12+、Android 8+
- **平板端**: iPadOS 13+、Android 8+

### 8.3 分辨率支持
- **最小分辨率**: 1024x768
- **推荐分辨率**: 1920x1080
- **高分辨率**: 4K 及以上

## 12. 项目时间规划

### 12.1 第一阶段 (4周) - 项目架构设计和搭建
- **Week 1**: Next.js项目搭建和基础配置
  - 创建Next.js 15项目
  - 配置TypeScript、ESLint、Prettier
  - 设置项目目录结构
  - 配置Tailwind CSS或CSS Modules
  - 建立基础组件库结构

- **Week 2**: 状态管理架构重构
  - 设计Zustand状态管理架构
  - 核心状态逻辑
  - 实现状态持久化
  - 建立状态管理规范

- **Week 3**: 路由和布局系统
  - 实现Next.js App Router
  - 建立页面布局组件
  - 实现响应式设计
  - 配置中间件和API路由

- **Week 4**: 基础组件
  - Button、Input、Modal等基础组件
  - 实现主题系统
  - 建立组件文档和Storybook
  - 完成基础组件测试

### 12.2 第二阶段 (6周) - 核心功能模块
- **Week 5-6**: 编辑器核心架构
  - Editor主组件
  - 实现Canvas画布系统
  - 建立元素渲染引擎
  - 实现基础编辑功能

- **Week 7-8**: 元素系统重构
  - TextElement、ImageElement
  - ShapeElement、LineElement
  - ChartElement、TableElement
  - 实现元素操作和交互

- **Week 9-10**: 工具栏和面板系统
  - Toolbar组件
  - 实现各种属性面板
  - 建立面板切换逻辑
  - 实现实时属性编辑

### 12.3 第三阶段 (4周) - 高级功能和导出
- **Week 11**: 动画和切换系统
  - 动画系统
  - 实现页面切换效果
  - 集成Framer Motion
  - 优化动画性能

- **Week 12**: 导出功能实现
  - PPTX导出
  - 实现图片导出
  - 实现PDF导出
  - 优化导出性能

- **Week 13**: 放映模式实现
  - 放映组件
  - 实现全屏模式
  - 实现演讲者视图
  - 添加放映工具

- **Week 14**: 移动端适配
  - 实现移动端编辑器
  - 优化触摸操作
  - 实现响应式布局
  - 移动端功能测试


### 12.5 技术里程碑

#### 里程碑1: 基础架构完成 (Week 4)
- [x] Next.js项目搭建完成
- [x] 状态管理架构重构完成
- [x] 基础组件库建立
- [x] 路由系统配置完成

#### 里程碑2: 核心功能完成 (Week 10)
- [x] 编辑器核心功能可用
- [x] 主要元素类型支持
- [x] 基础编辑操作正常
- [x] 工具栏功能完整

#### 里程碑3: 高级功能完成 (Week 14)
- [x] 动画系统正常工作
- [x] 导出功能完整
- [x] 放映模式可用
- [x] 移动端适配完成

#### 里程碑4: 项目交付 (Week 16)
- [x] 所有功能测试通过
- [x] 性能指标达标
- [x] 文档完整
- [x] 部署就绪
