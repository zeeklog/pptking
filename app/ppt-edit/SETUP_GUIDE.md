# PPT KING 安装和配置指南

## 🚀 快速开始

### 1. 基础安装
项目的核心功能不需要额外依赖，可以直接运行：

```bash
# 安装基础依赖
npm install

# 启动开发服务器
npm run dev
```

访问 `http://localhost:3000/ppt-edit` 即可使用PPT编辑器。

### 2. 功能验证
启动后可以立即使用以下核心功能：
- ✅ 文本、形状、图片编辑
- ✅ 幻灯片管理和排序
- ✅ 撤销重做、复制粘贴
- ✅ 对齐线和磁性吸附
- ✅ JSON格式导出
- ✅ 演示模式和手写板

## 🔧 可选功能增强

### 3. 安装增强依赖
如需启用高级功能，可安装可选依赖：

```bash
# 方法1: 使用安装脚本 (推荐)
./install-optional-deps.sh

# 方法2: 手动安装全部
npm install pptxgenjs html-to-image jspdf jszip echarts katex @types/katex

# 方法3: 按需安装
npm install pptxgenjs        # PPTX导出
npm install echarts          # 图表渲染  
npm install katex @types/katex # 公式渲染
```

### 4. 增强功能列表
安装可选依赖后可启用：
- 📄 PPTX文件导出 (需要 pptxgenjs)
- 📄 PDF文件导出 (需要 html-to-image + jspdf)
- 🖼️ 批量图片导出 (需要 html-to-image + jszip)
- 📊 动态图表渲染 (需要 echarts)
- 🧮 LaTeX公式渲染 (需要 katex)

## 🎯 AI功能配置

### 5. SiliconFlow API配置
AI功能需要配置SiliconFlow API密钥：

```bash
# 复制环境变量模板
cp env.example .env.local

# 编辑环境变量
# NEXT_PUBLIC_SILICONFLOW_API_KEY=your_api_key_here
```

### 6. AI功能说明
- 🤖 PPT大纲生成
- 📝 内容优化 (重写/扩展/总结)
- 🎨 智能布局优化
- 💡 内容建议

## 📱 移动端支持

### 7. 移动端功能
- ✅ 响应式界面设计
- ✅ 触摸操作支持
- ✅ 移动端工具栏
- ✅ 简化的编辑功能

## 🔍 依赖状态检查

### 8. 实时依赖监控
- 状态栏显示依赖状态
- 点击查看详细依赖报告
- 一键复制安装命令
- 功能可用性提示

### 9. 开发模式
开发模式下会在控制台显示详细的依赖检查报告：
```
PPT KING 依赖检查报告
✅ 已安装的依赖:
  - zustand: 状态管理
  - @dnd-kit/core: 拖拽功能
⚠️ 缺失的依赖 (可选):
  - pptxgenjs: PPTX导出功能
  - echarts: 图表渲染功能
```

## 🛠️ 故障排除

### 10. 常见问题

**Q: 导出功能不可用？**
A: 检查可选依赖是否安装，或使用JSON导出作为替代方案。

**Q: 图表显示为静态预览？**
A: 需要安装echarts库: `npm install echarts`

**Q: LaTeX公式显示原始代码？**
A: 需要安装katex库: `npm install katex @types/katex`

**Q: AI功能不工作？**
A: 检查SILICONFLOW_API_KEY环境变量是否正确配置。

### 11. 性能优化
- 🚀 拖拽动画优化
- 🚀 批量操作优化
- 🚀 内存管理优化
- 🚀 渲染性能优化

## 📚 相关文档

- [功能验证清单](./FEATURE_VERIFICATION.md)
- [依赖说明](./DEPENDENCIES.md)
- [产品设计需求](../PPT KING 产品设计需求说明书.md)

## 🎉 部署建议

### 12. 生产环境部署
```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

### 13. 环境变量配置
```env
# AI功能 (可选)
NEXT_PUBLIC_SILICONFLOW_API_KEY=your_api_key

# 其他配置
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

**🎊 恭喜！PPT KING 已经完全可以投入使用了！**

所有核心功能都已实现，可选依赖提供增强功能，用户体验完全符合PowerPoint标准。