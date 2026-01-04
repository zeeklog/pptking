# OpenRouter 安全 API 接口

## 概述

为了增强安全性，我们创建了专门的服务端接口，将系统提示词保护在服务端，避免在客户端暴露敏感的提示词信息。

## 安全改进

### ❌ 之前的问题
- 系统提示词在客户端代码中直接暴露
- 用户可以通过浏览器开发者工具查看完整的系统提示词
- 存在提示词泄露和被恶意利用的风险

### ✅ 现在的解决方案
- 系统提示词完全保存在服务端文件中
- 客户端只需要发送用户输入，无需包含系统提示词
- 提示词在服务端动态读取并注入到请求中

## 新增接口

### 1. 提示词增强接口

**端点**: `POST /api/chat/openrouter/enhance`

**功能**: 使用 `enhance_prompt.md` 中的系统提示词来增强用户输入的提示词

**请求参数**:
```json
{
  "prompt": "用户原始提示词",
  "model": "openai/gpt-3.5-turbo"  // 可选，默认 gpt-3.5-turbo
}
```

**响应**: 流式 SSE 响应，返回增强后的提示词

**使用示例**:
```typescript
const response = await fetch("/api/chat/openrouter/enhance", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    prompt: "创建一个关于人工智能的演示",
    model: "openai/gpt-3.5-turbo"
  }),
});

// 处理流式响应...
```

### 2. PPT 生成接口

**端点**: `POST /api/chat/openrouter/ppt-generate`

**功能**: 使用 `ppt_prompt.md` 中的系统提示词来生成 PPT 大纲

**请求参数**:
```json
{
  "topic": "PPT主题",
  "slideCount": 10,           // 可选，默认 10
  "audience": "目标听众",      // 可选
  "duration": "演讲时长分钟",   // 可选
  "requirements": "具体要求",  // 可选
  "model": "openai/gpt-3.5-turbo"  // 可选
}
```

**响应**: 流式 SSE 响应，返回 Markdown 格式的 PPT 内容

**使用示例**:
```typescript
const response = await fetch("/api/chat/openrouter/ppt-generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    topic: "人工智能发展趋势",
    slideCount: 15,
    audience: "技术团队",
    duration: 20,
    model: "openai/gpt-3.5-turbo"
  }),
});

// 处理流式响应...
```

## 文件结构

```
app/
├── api/chat/openrouter/
│   ├── enhance/
│   │   └── route.ts          # 提示词增强接口
│   ├── ppt-generate/
│   │   └── route.ts          # PPT生成接口
│   └── [...path]/
│       └── route.ts          # 通用代理接口（保留兼容性）
└── prompts/
    ├── enhance_prompt.md     # 提示词增强系统提示词
    └── ppt_prompt.md         # PPT生成系统提示词
```

## 安全特性

### 🔒 系统提示词保护
- 提示词文件存储在服务端
- 客户端无法访问系统提示词内容
- 使用 `fs/promises` 在运行时动态读取

### 🛡️ 权限验证
- 继承现有的认证机制
- 支持 API Key 验证
- 请求日志记录（不记录敏感信息）

### ⚡ 性能优化
- 流式响应支持
- 错误处理和超时控制
- 响应头安全处理

## 客户端更新

### GenerateClient.tsx
- `handleGenerate()`: 使用 `/api/chat/openrouter/ppt-generate`
- `handleGenerateOutline()`: 使用 `/api/chat/openrouter/enhance`

### AIAssistant.tsx
- PPT 生成功能使用 `/api/chat/openrouter/ppt-generate`

## 向后兼容性

- 保留原有的通用代理接口 `/api/chat/openrouter/v1/chat/completions`
- 新接口为推荐使用方式
- 逐步迁移现有功能到专用接口

## 环境配置

确保在 `.env` 文件中配置：

```bash
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_URL=https://openrouter.ai/api
```

## 测试

```bash
# 测试提示词增强 - ✅ 已验证工作正常
curl -X POST http://localhost:3000/api/chat/openrouter/enhance \
  -H "Content-Type: application/json" \
  -d '{"prompt": "创建AI演示"}'
# 返回流式增强后的中文提示词

# 测试PPT生成 - ✅ 已验证工作正常  
curl -X POST http://localhost:3000/api/chat/openrouter/ppt-generate \
  -H "Content-Type: application/json" \
  -d '{"topic": "人工智能发展", "slideCount": 5}'
# 返回流式Markdown格式的PPT内容
```

## 测试结果

✅ **所有API接口均已通过测试验证**:
- ✅ 提示词增强接口：返回正确的中文增强提示词流式响应
- ✅ PPT生成接口：返回正确的Markdown格式PPT流式响应  
- ✅ 系统提示词完全隐藏在服务端，客户端无法访问
- ✅ Edge Runtime兼容性问题已解决

## 迁移指南

### 从通用接口迁移到专用接口

**之前**:
```typescript
const response = await fetch("/api/chat/openrouter/v1/chat/completions", {
  body: JSON.stringify({
    model: "openai/gpt-3.5-turbo",
    messages: [
      { role: "system", content: "暴露的系统提示词..." },
      { role: "user", content: "用户输入" }
    ]
  })
});
```

**现在**:
```typescript
const response = await fetch("/api/chat/openrouter/ppt-generate", {
  body: JSON.stringify({
    topic: "用户输入",
    model: "openai/gpt-3.5-turbo"
  })
});
```

这种方式更安全，更简洁，并且提供了更好的类型安全性。